package ca.gapwise.mobile.devicecrypto

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.nio.charset.StandardCharsets
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.SecureRandom
import java.security.interfaces.RSAPublicKey
import java.security.spec.MGF1ParameterSpec
import java.security.spec.RSAKeyGenParameterSpec
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import javax.crypto.spec.SecretKeySpec

class GapwiseDeviceCryptoModule : Module() {
  private data class DataKey(val accountId: String, val keyId: String, val bytes: ByteArray)

  private val dataKeys = ConcurrentHashMap<String, DataKey>()
  private val random = SecureRandom()

  override fun definition() = ModuleDefinition {
    Name("GapwiseDeviceCrypto")

    Function("getOrCreatePublicJwk") { accountId: String ->
      requireAccountId(accountId)
      val publicKey = getOrCreateKeyPair(accountId) as RSAPublicKey
      val modulus = unsignedFixed(publicKey.modulus.toByteArray(), RSA_BYTES)
      val exponent = unsigned(publicKey.publicExponent.toByteArray())
      if (!exponent.contentEquals(byteArrayOf(1, 0, 1))) {
        throw IllegalStateException("Unsupported RSA public exponent.")
      }
      "{" +
        "\"kty\":\"RSA\"," +
        "\"alg\":\"RSA-OAEP-256\"," +
        "\"e\":\"AQAB\"," +
        "\"n\":\"${base64Url(modulus)}\"," +
        "\"ext\":true," +
        "\"key_ops\":[\"encrypt\"]}"
    }

    Function("unwrapDataKey") { accountId: String, keyId: String, wrappedDekBase64Url: String ->
      requireAccountId(accountId)
      requireOpaqueId(keyId, "key ID")
      val wrapped = decodeBase64Url(wrappedDekBase64Url, RSA_BYTES)
      val privateKey = keyStore().getKey(alias(accountId), null)
        ?: throw IllegalStateException("Device private key is unavailable.")
      val raw = if (usesPlatformOaep()) {
        val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
        val params = OAEPParameterSpec(
          "SHA-256",
          "MGF1",
          MGF1ParameterSpec.SHA256,
          PSource.PSpecified.DEFAULT,
        )
        cipher.init(Cipher.DECRYPT_MODE, privateKey, params)
        cipher.doFinal(wrapped)
      } else {
        val cipher = Cipher.getInstance("RSA/ECB/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, privateKey)
        decodeOaepSha256(cipher.doFinal(wrapped))
      }
      if (raw.size != AES_BYTES) {
        raw.fill(0)
        throw IllegalStateException("Device key unwrap failed.")
      }
      val handle = UUID.randomUUID().toString()
      dataKeys[handle] = DataKey(accountId, keyId, raw)
      handle
    }

    Function("decryptJsonRecord") {
      handle: String,
      ciphertextBase64Url: String,
      nonceBase64Url: String,
      additionalDataUtf8: String,
      ->
      val stored = dataKeys[handle] ?: throw IllegalStateException("Data key handle is unavailable.")
      val ciphertext = decodeBase64Url(ciphertextBase64Url, MAX_CIPHERTEXT_BYTES)
      if (ciphertext.size < GCM_TAG_BYTES) throw IllegalArgumentException("Invalid ciphertext.")
      val nonce = decodeBase64Url(nonceBase64Url, GCM_NONCE_BYTES)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(stored.bytes, "AES"), GCMParameterSpec(128, nonce))
      cipher.updateAAD(additionalDataUtf8.toByteArray(StandardCharsets.UTF_8))
      val plaintext = try {
        cipher.doFinal(ciphertext)
      } catch (_: Exception) {
        throw IllegalStateException("Encrypted data authentication failed.")
      }
      if (plaintext.size > MAX_PLAINTEXT_BYTES) {
        plaintext.fill(0)
        throw IllegalStateException("Decrypted data is too large.")
      }
      val text = plaintext.toString(StandardCharsets.UTF_8)
      plaintext.fill(0)
      text
    }

    Function("encryptJsonRecord") { handle: String, plaintextUtf8: String, additionalDataUtf8: String ->
      val stored = dataKeys[handle] ?: throw IllegalStateException("Data key handle is unavailable.")
      val plaintext = plaintextUtf8.toByteArray(StandardCharsets.UTF_8)
      if (plaintext.size > MAX_PLAINTEXT_BYTES) throw IllegalArgumentException("Plaintext is too large.")
      val nonce = ByteArray(GCM_NONCE_BYTES).also(random::nextBytes)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(stored.bytes, "AES"), GCMParameterSpec(128, nonce))
      cipher.updateAAD(additionalDataUtf8.toByteArray(StandardCharsets.UTF_8))
      val ciphertext = cipher.doFinal(plaintext)
      plaintext.fill(0)
      "{\"ciphertext\":\"${base64Url(ciphertext)}\",\"nonce\":\"${base64Url(nonce)}\"}"
    }

    Function("clearAccount") { accountId: String ->
      requireAccountId(accountId)
      val aliases = listOf(aliasForMode(accountId, true), aliasForMode(accountId, false))
      val store = keyStore()
      aliases.forEach { if (store.containsAlias(it)) store.deleteEntry(it) }
      dataKeys.entries.removeIf { (_, key) ->
        if (key.accountId == accountId) {
          key.bytes.fill(0)
          true
        } else {
          false
        }
      }
    }
  }

  private fun getOrCreateKeyPair(accountId: String): RSAPublicKey {
    val store = keyStore()
    val keyAlias = alias(accountId)
    val existing = store.getCertificate(keyAlias)?.publicKey as? RSAPublicKey
    if (existing != null) return existing

    val generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore")
    val builder = KeyGenParameterSpec.Builder(keyAlias, KeyProperties.PURPOSE_DECRYPT)
      .setAlgorithmParameterSpec(RSAKeyGenParameterSpec(RSA_BITS, RSAKeyGenParameterSpec.F4))

    if (usesPlatformOaep()) {
      builder
        .setDigests(KeyProperties.DIGEST_SHA256)
        .setMgf1Digests(KeyProperties.DIGEST_SHA256)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
    } else {
      builder
        .setDigests(KeyProperties.DIGEST_NONE)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setRandomizedEncryptionRequired(false)
    }

    generator.initialize(builder.build())
    return generator.generateKeyPair().public as RSAPublicKey
  }

  private fun keyStore(): KeyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

  private fun usesPlatformOaep() = Build.VERSION.SDK_INT >= 35

  private fun alias(accountId: String) = aliasForMode(accountId, usesPlatformOaep())

  private fun aliasForMode(accountId: String, platformOaep: Boolean): String {
    val digest = MessageDigest.getInstance("SHA-256")
      .digest(accountId.lowercase().toByteArray(StandardCharsets.UTF_8))
      .joinToString("") { "%02x".format(it) }
    return "gapwise.device.rsa.${if (platformOaep) "oaep" else "raw"}.$digest"
  }

  private fun decodeOaepSha256(encoded: ByteArray): ByteArray {
    if (encoded.size != RSA_BYTES || encoded[0].toInt() != 0) {
      throw IllegalStateException("Device key unwrap failed.")
    }
    val hLen = SHA256_BYTES
    val maskedSeed = encoded.copyOfRange(1, 1 + hLen)
    val maskedDb = encoded.copyOfRange(1 + hLen, encoded.size)
    val seedMask = mgf1Sha256(maskedDb, hLen)
    val seed = xor(maskedSeed, seedMask)
    val dbMask = mgf1Sha256(seed, maskedDb.size)
    val db = xor(maskedDb, dbMask)
    seed.fill(0)
    seedMask.fill(0)
    dbMask.fill(0)

    val expectedHash = MessageDigest.getInstance("SHA-256").digest(ByteArray(0))
    var invalid = 0
    for (i in expectedHash.indices) {
      invalid = invalid or (db[i].toInt() xor expectedHash[i].toInt())
    }

    var delimiter = -1
    for (i in hLen until db.size) {
      val value = db[i].toInt() and 0xff
      if (delimiter < 0) {
        when (value) {
          0 -> Unit
          1 -> delimiter = i
          else -> invalid = invalid or 1
        }
      }
    }
    if (delimiter < 0) invalid = invalid or 1
    val messageLength = if (delimiter >= 0) db.size - delimiter - 1 else -1
    if (messageLength != AES_BYTES) invalid = invalid or 1
    if (invalid != 0) {
      db.fill(0)
      throw IllegalStateException("Device key unwrap failed.")
    }
    val message = db.copyOfRange(delimiter + 1, db.size)
    db.fill(0)
    return message
  }

  private fun mgf1Sha256(seed: ByteArray, outputLength: Int): ByteArray {
    val output = ByteArray(outputLength)
    val digest = MessageDigest.getInstance("SHA-256")
    var offset = 0
    var counter = 0
    while (offset < outputLength) {
      digest.reset()
      digest.update(seed)
      digest.update(byteArrayOf(
        (counter ushr 24).toByte(),
        (counter ushr 16).toByte(),
        (counter ushr 8).toByte(),
        counter.toByte(),
      ))
      val block = digest.digest()
      val length = minOf(block.size, outputLength - offset)
      System.arraycopy(block, 0, output, offset, length)
      block.fill(0)
      offset += length
      counter += 1
    }
    return output
  }

  private fun xor(left: ByteArray, right: ByteArray): ByteArray {
    require(left.size == right.size)
    return ByteArray(left.size) { index -> (left[index].toInt() xor right[index].toInt()).toByte() }
  }

  private fun unsigned(value: ByteArray): ByteArray {
    var first = 0
    while (first < value.size - 1 && value[first].toInt() == 0) first += 1
    return value.copyOfRange(first, value.size)
  }

  private fun unsignedFixed(value: ByteArray, size: Int): ByteArray {
    val unsigned = unsigned(value)
    if (unsigned.size > size) throw IllegalStateException("RSA modulus is too large.")
    return ByteArray(size).also { System.arraycopy(unsigned, 0, it, size - unsigned.size, unsigned.size) }
  }

  private fun base64Url(value: ByteArray): String =
    Base64.encodeToString(value, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)

  private fun decodeBase64Url(value: String, exactOrMaximumBytes: Int): ByteArray {
    if (value.length > ((exactOrMaximumBytes * 4) / 3) + 8) throw IllegalArgumentException("Encoded value is too large.")
    return try {
      Base64.decode(value, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    } catch (_: IllegalArgumentException) {
      throw IllegalArgumentException("Encoded value is malformed.")
    }
  }

  private fun requireAccountId(value: String) = requireOpaqueId(value, "account ID")

  private fun requireOpaqueId(value: String, name: String) {
    if (!UUID_PATTERN.matches(value)) throw IllegalArgumentException("Invalid $name.")
  }

  companion object {
    private const val RSA_BITS = 2048
    private const val RSA_BYTES = 256
    private const val AES_BYTES = 32
    private const val SHA256_BYTES = 32
    private const val GCM_NONCE_BYTES = 12
    private const val GCM_TAG_BYTES = 16
    private const val MAX_PLAINTEXT_BYTES = 256 * 1024
    private const val MAX_CIPHERTEXT_BYTES = MAX_PLAINTEXT_BYTES + GCM_TAG_BYTES
    private val UUID_PATTERN = Regex("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$")
  }
}
