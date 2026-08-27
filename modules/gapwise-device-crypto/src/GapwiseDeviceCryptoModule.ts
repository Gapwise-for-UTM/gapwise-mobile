import { requireNativeModule } from "expo-modules-core";

import type {
  DevicePublicJwk,
  EncryptedRecord,
  GapwiseDeviceCryptoNativeModule,
} from "./GapwiseDeviceCrypto.types";

const native =
  requireNativeModule<GapwiseDeviceCryptoNativeModule>("GapwiseDeviceCrypto");

export function getOrCreatePublicJwk(accountId: string): DevicePublicJwk {
  return JSON.parse(native.getOrCreatePublicJwk(accountId)) as DevicePublicJwk;
}

export function unwrapDataKey(
  accountId: string,
  keyId: string,
  wrappedDekBase64Url: string,
): string {
  return native.unwrapDataKey(accountId, keyId, wrappedDekBase64Url);
}

export function decryptJsonRecord(
  handle: string,
  record: EncryptedRecord,
  additionalDataUtf8: string,
): string {
  return native.decryptJsonRecord(
    handle,
    record.ciphertext,
    record.nonce,
    additionalDataUtf8,
  );
}

export function encryptJsonRecord(
  handle: string,
  plaintextUtf8: string,
  additionalDataUtf8: string,
): EncryptedRecord {
  return JSON.parse(
    native.encryptJsonRecord(handle, plaintextUtf8, additionalDataUtf8),
  ) as EncryptedRecord;
}

export function clearAccount(accountId: string): void {
  native.clearAccount(accountId);
}
