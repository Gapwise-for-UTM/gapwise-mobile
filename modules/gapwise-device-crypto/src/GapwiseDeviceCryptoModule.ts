import { NativeModule, requireNativeModule } from "expo";

import type { DevicePublicJwk, EncryptedRecord } from "./GapwiseDeviceCrypto.types";

declare class GapwiseDeviceCryptoNativeModule extends NativeModule<{}> {
  getOrCreatePublicJwk(accountId: string): string;
  unwrapDataKey(accountId: string, keyId: string, wrappedDekBase64Url: string): string;
  decryptJsonRecord(
    handle: string,
    ciphertextBase64Url: string,
    nonceBase64Url: string,
    additionalDataUtf8: string,
  ): string;
  encryptJsonRecord(handle: string, plaintextUtf8: string, additionalDataUtf8: string): string;
  clearAccount(accountId: string): void;
}

const native = requireNativeModule<GapwiseDeviceCryptoNativeModule>("GapwiseDeviceCrypto");

export function getOrCreatePublicJwk(accountId: string): DevicePublicJwk {
  return JSON.parse(native.getOrCreatePublicJwk(accountId)) as DevicePublicJwk;
}

export function unwrapDataKey(accountId: string, keyId: string, wrappedDekBase64Url: string) {
  return native.unwrapDataKey(accountId, keyId, wrappedDekBase64Url);
}

export function decryptJsonRecord(
  handle: string,
  ciphertextBase64Url: string,
  nonceBase64Url: string,
  additionalDataUtf8: string,
) {
  return native.decryptJsonRecord(
    handle,
    ciphertextBase64Url,
    nonceBase64Url,
    additionalDataUtf8,
  );
}

export function encryptJsonRecord(
  handle: string,
  plaintextUtf8: string,
  additionalDataUtf8: string,
): EncryptedRecord {
  return JSON.parse(native.encryptJsonRecord(handle, plaintextUtf8, additionalDataUtf8)) as EncryptedRecord;
}

export function clearAccount(accountId: string) {
  native.clearAccount(accountId);
}
