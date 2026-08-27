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
