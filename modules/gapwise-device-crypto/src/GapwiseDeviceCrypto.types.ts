export type DevicePublicJwk = {
  kty: "RSA";
  alg: "RSA-OAEP-256";
  e: "AQAB";
  n: string;
  ext: true;
  key_ops: ["encrypt"];
};

export type EncryptedRecord = {
  ciphertext: string;
  nonce: string;
};

export type GapwiseDeviceCryptoNativeModule = {
  getOrCreatePublicJwk(accountId: string): string;
  unwrapDataKey(
    accountId: string,
    keyId: string,
    wrappedDekBase64Url: string,
  ): string;
  decryptJsonRecord(
    handle: string,
    ciphertextBase64Url: string,
    nonceBase64Url: string,
    additionalDataUtf8: string,
  ): string;
  encryptJsonRecord(handle: string, plaintextUtf8: string, additionalDataUtf8: string): string;
  clearAccount(accountId: string): void;
};
