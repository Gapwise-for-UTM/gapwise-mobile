package ca.gapwise.mobile.devicecrypto

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.spec.MGF1ParameterSpec
import java.security.spec.RSAKeyGenParameterSpec
import javax.crypto.Cipher
import javax.crypto.spec.OAEPParameterSpec
import javax.crypto.spec.PSource
import org.junit.After
import org.junit.Assert.assertArrayEquals
import org.junit.Assert.assertThrows
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class OaepSha256InteropTest {
  private val alias = "gapwise.test.oaep.sha256"

  @After
  fun cleanup() {
    keyStore().apply {
      if (containsAlias(alias)) deleteEntry(alias)
    }
  }

  @Test
  fun webCompatibleOaepSha256EnvelopeUnwrapsThroughPre35RawRsaPath() {
    val pair = generateRawRsaKeyPair()
    val expectedDek = ByteArray(32) { it.toByte() }
    val oaep = OAEPParameterSpec(
      "SHA-256",
      "MGF1",
      MGF1ParameterSpec.SHA256,
      PSource.PSpecified.DEFAULT,
    )

    // Produce the exact RSA-OAEP/SHA-256 + MGF1-SHA-256 envelope used by WebCrypto.
    val encrypt = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding")
    encrypt.init(Cipher.ENCRYPT_MODE, pair.public, oaep)
    val wrapped = encrypt.doFinal(expectedDek)

    // Android <35 cannot authorize MGF1-SHA256 directly in Keystore. Production therefore
    // performs only the non-exportable raw private RSA operation in Keystore and decodes
    // OAEP-SHA256 natively. Exercise those exact two primitives here on an API-34 emulator.
    val rawRsa = Cipher.getInstance("RSA/ECB/NoPadding")
    rawRsa.init(Cipher.DECRYPT_MODE, pair.private)
    val encodedMessage = rawRsa.doFinal(wrapped)

    val module = GapwiseDeviceCryptoModule()
    val decoder = GapwiseDeviceCryptoModule::class.java.getDeclaredMethod(
      "decodeOaepSha256",
      ByteArray::class.java,
    )
    decoder.isAccessible = true
    val actualDek = decoder.invoke(module, encodedMessage) as ByteArray

    assertArrayEquals(expectedDek, actualDek)
    actualDek.fill(0)
    encodedMessage.fill(0)
    expectedDek.fill(0)
  }

  @Test
  fun malformedOaepEncodingIsRejected() {
    val module = GapwiseDeviceCryptoModule()
    val decoder = GapwiseDeviceCryptoModule::class.java.getDeclaredMethod(
      "decodeOaepSha256",
      ByteArray::class.java,
    )
    decoder.isAccessible = true

    val malformed = ByteArray(256)
    assertThrows(java.lang.reflect.InvocationTargetException::class.java) {
      decoder.invoke(module, malformed)
    }
  }

  private fun generateRawRsaKeyPair() =
    KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore").run {
      initialize(
        KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_DECRYPT)
          .setAlgorithmParameterSpec(RSAKeyGenParameterSpec(2048, RSAKeyGenParameterSpec.F4))
          .setDigests(KeyProperties.DIGEST_NONE)
          .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
          .setRandomizedEncryptionRequired(false)
          .build(),
      )
      generateKeyPair()
    }

  private fun keyStore(): KeyStore = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
}
