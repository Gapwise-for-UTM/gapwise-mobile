import CryptoKit
import ExpoModulesCore
import Foundation
import Security

public class GapwiseDeviceCryptoModule: Module {
  private struct StoredDataKey {
    let accountId: String
    let keyId: String
    let key: SymmetricKey
  }

  private var dataKeys: [String: StoredDataKey] = [:]

  public func definition() -> ModuleDefinition {
    Name("GapwiseDeviceCrypto")

    Function("getOrCreatePublicJwk") { (accountId: String) throws -> String in
      try self.requireOpaqueId(accountId, name: "account ID")
      let privateKey = try self.getOrCreatePrivateKey(accountId: accountId)
      guard let publicKey = SecKeyCopyPublicKey(privateKey) else {
        throw CryptoError("Device public key is unavailable.")
      }
      var error: Unmanaged<CFError>?
      guard let external = SecKeyCopyExternalRepresentation(publicKey, &error) as Data? else {
        throw CryptoError("Device public key export failed.")
      }
      let modulus = try self.rsaModulus(fromPkcs1PublicKey: external)
      guard modulus.count == Self.rsaBytes else {
        throw CryptoError("Unsupported RSA modulus length.")
      }
      let jwk: [String: Any] = [
        "kty": "RSA",
        "alg": "RSA-OAEP-256",
        "e": "AQAB",
        "n": self.base64Url(modulus),
        "ext": true,
        "key_ops": ["encrypt"],
      ]
      let encoded = try JSONSerialization.data(withJSONObject: jwk, options: [.sortedKeys])
      guard let text = String(data: encoded, encoding: .utf8) else {
        throw CryptoError("Device public key serialization failed.")
      }
      return text
    }

    Function("unwrapDataKey") { (accountId: String, keyId: String, wrappedDekBase64Url: String) throws -> String in
      try self.requireOpaqueId(accountId, name: "account ID")
      try self.requireOpaqueId(keyId, name: "key ID")
      let wrapped = try self.decodeBase64Url(wrappedDekBase64Url, maximumBytes: Self.rsaBytes)
      guard wrapped.count == Self.rsaBytes else {
        throw CryptoError("Device-wrapped key has an invalid length.")
      }
      let privateKey = try self.getOrCreatePrivateKey(accountId: accountId)
      guard SecKeyIsAlgorithmSupported(privateKey, .decrypt, .rsaEncryptionOAEPSHA256) else {
        throw CryptoError("RSA-OAEP-SHA256 is unavailable on this device.")
      }
      var error: Unmanaged<CFError>?
      guard let raw = SecKeyCreateDecryptedData(
        privateKey,
        .rsaEncryptionOAEPSHA256,
        wrapped as CFData,
        &error
      ) as Data? else {
        throw CryptoError("Device key unwrap failed.")
      }
      guard raw.count == Self.aesBytes else {
        throw CryptoError("Device key unwrap failed.")
      }
      let handle = UUID().uuidString.lowercased()
      self.dataKeys[handle] = StoredDataKey(
        accountId: accountId,
        keyId: keyId,
        key: SymmetricKey(data: raw)
      )
      return handle
    }

    Function("decryptJsonRecord") {
      (handle: String, ciphertextBase64Url: String, nonceBase64Url: String, additionalDataUtf8: String) throws -> String in
      guard let stored = self.dataKeys[handle] else {
        throw CryptoError("Data key handle is unavailable.")
      }
      let combined = try self.decodeBase64Url(
        ciphertextBase64Url,
        maximumBytes: Self.maximumPlaintextBytes + Self.gcmTagBytes
      )
      guard combined.count >= Self.gcmTagBytes else {
        throw CryptoError("Invalid ciphertext.")
      }
      let nonceData = try self.decodeBase64Url(nonceBase64Url, maximumBytes: Self.gcmNonceBytes)
      guard nonceData.count == Self.gcmNonceBytes else {
        throw CryptoError("Invalid AES-GCM nonce.")
      }
      let ciphertext = combined.prefix(combined.count - Self.gcmTagBytes)
      let tag = combined.suffix(Self.gcmTagBytes)
      do {
        let nonce = try AES.GCM.Nonce(data: nonceData)
        let box = try AES.GCM.SealedBox(nonce: nonce, ciphertext: ciphertext, tag: tag)
        let plaintext = try AES.GCM.open(
          box,
          using: stored.key,
          authenticating: Data(additionalDataUtf8.utf8)
        )
        guard plaintext.count <= Self.maximumPlaintextBytes else {
          throw CryptoError("Decrypted data is too large.")
        }
        guard let text = String(data: plaintext, encoding: .utf8) else {
          throw CryptoError("Decrypted data is malformed.")
        }
        return text
      } catch let error as CryptoError {
        throw error
      } catch {
        throw CryptoError("Encrypted data authentication failed.")
      }
    }

    Function("encryptJsonRecord") { (handle: String, plaintextUtf8: String, additionalDataUtf8: String) throws -> String in
      guard let stored = self.dataKeys[handle] else {
        throw CryptoError("Data key handle is unavailable.")
      }
      let plaintext = Data(plaintextUtf8.utf8)
      guard plaintext.count <= Self.maximumPlaintextBytes else {
        throw CryptoError("Plaintext is too large.")
      }
      let sealed = try AES.GCM.seal(
        plaintext,
        using: stored.key,
        authenticating: Data(additionalDataUtf8.utf8)
      )
      let combined = sealed.ciphertext + sealed.tag
      let nonce = sealed.nonce.withUnsafeBytes { Data($0) }
      let value: [String: String] = [
        "ciphertext": self.base64Url(combined),
        "nonce": self.base64Url(nonce),
      ]
      let encoded = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
      guard let text = String(data: encoded, encoding: .utf8) else {
        throw CryptoError("Encrypted record serialization failed.")
      }
      return text
    }

    Function("clearAccount") { (accountId: String) throws in
      try self.requireOpaqueId(accountId, name: "account ID")
      let tag = self.keyTag(accountId: accountId)
      SecItemDelete([
        kSecClass: kSecClassKey,
        kSecAttrApplicationTag: tag,
        kSecAttrKeyType: kSecAttrKeyTypeRSA,
      ] as CFDictionary)
      self.dataKeys = self.dataKeys.filter { $0.value.accountId != accountId }
    }
  }

  private func getOrCreatePrivateKey(accountId: String) throws -> SecKey {
    let tag = keyTag(accountId: accountId)
    var item: CFTypeRef?
    let query: [CFString: Any] = [
      kSecClass: kSecClassKey,
      kSecAttrApplicationTag: tag,
      kSecAttrKeyType: kSecAttrKeyTypeRSA,
      kSecReturnRef: true,
    ]
    let status = SecItemCopyMatching(query as CFDictionary, &item)
    if status == errSecSuccess, let existing = item as! SecKey? {
      return existing
    }
    if status != errSecItemNotFound {
      throw CryptoError("Device private key lookup failed.")
    }

    let privateAttributes: [CFString: Any] = [
      kSecAttrIsPermanent: true,
      kSecAttrApplicationTag: tag,
      kSecAttrAccessible: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
    ]
    let attributes: [CFString: Any] = [
      kSecAttrKeyType: kSecAttrKeyTypeRSA,
      kSecAttrKeySizeInBits: Self.rsaBits,
      kSecPrivateKeyAttrs: privateAttributes,
    ]
    var error: Unmanaged<CFError>?
    guard let created = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
      throw CryptoError("Device private key generation failed.")
    }
    return created
  }

  private func keyTag(accountId: String) -> Data {
    let digest = SHA256.hash(data: Data(accountId.lowercased().utf8))
    let suffix = digest.map { String(format: "%02x", $0) }.joined()
    return Data("ca.gapwise.mobile.devicecrypto.\(suffix)".utf8)
  }

  private func rsaModulus(fromPkcs1PublicKey data: Data) throws -> Data {
    var cursor = 0
    try expectTag(0x30, in: data, cursor: &cursor)
    _ = try readLength(in: data, cursor: &cursor)
    try expectTag(0x02, in: data, cursor: &cursor)
    let modulusLength = try readLength(in: data, cursor: &cursor)
    guard modulusLength > 0, cursor + modulusLength <= data.count else {
      throw CryptoError("Device public key is malformed.")
    }
    var modulus = data.subdata(in: cursor..<(cursor + modulusLength))
    if modulus.first == 0 { modulus.removeFirst() }
    return modulus
  }

  private func expectTag(_ expected: UInt8, in data: Data, cursor: inout Int) throws {
    guard cursor < data.count, data[cursor] == expected else {
      throw CryptoError("Device public key is malformed.")
    }
    cursor += 1
  }

  private func readLength(in data: Data, cursor: inout Int) throws -> Int {
    guard cursor < data.count else { throw CryptoError("Device public key is malformed.") }
    let first = Int(data[cursor])
    cursor += 1
    if first & 0x80 == 0 { return first }
    let count = first & 0x7f
    guard count > 0, count <= 4, cursor + count <= data.count else {
      throw CryptoError("Device public key is malformed.")
    }
    var value = 0
    for _ in 0..<count {
      value = (value << 8) | Int(data[cursor])
      cursor += 1
    }
    return value
  }

  private func base64Url(_ data: Data) -> String {
    data.base64EncodedString()
      .replacingOccurrences(of: "+", with: "-")
      .replacingOccurrences(of: "/", with: "_")
      .replacingOccurrences(of: "=", with: "")
  }

  private func decodeBase64Url(_ value: String, maximumBytes: Int) throws -> Data {
    guard value.utf8.count <= ((maximumBytes * 4) / 3) + 8 else {
      throw CryptoError("Encoded value is too large.")
    }
    var standard = value.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
    let remainder = standard.count % 4
    if remainder != 0 { standard += String(repeating: "=", count: 4 - remainder) }
    guard let data = Data(base64Encoded: standard), data.count <= maximumBytes else {
      throw CryptoError("Encoded value is malformed.")
    }
    return data
  }

  private func requireOpaqueId(_ value: String, name: String) throws {
    guard value.count == 36, UUID(uuidString: value) != nil else {
      throw CryptoError("Invalid \(name).")
    }
  }

  private struct CryptoError: Error, CustomStringConvertible {
    let description: String
    init(_ description: String) { self.description = description }
  }

  private static let rsaBits = 2048
  private static let rsaBytes = 256
  private static let aesBytes = 32
  private static let gcmNonceBytes = 12
  private static let gcmTagBytes = 16
  private static let maximumPlaintextBytes = 256 * 1024
}
