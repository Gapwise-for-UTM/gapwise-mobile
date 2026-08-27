import { requireNativeModule } from 'expo-modules-core';

import type {
  EncryptedRecord,
  GeneratedDeviceKeyPair,
  GapwiseDeviceCryptoNativeModule,
} from './GapwiseDeviceCrypto.types';

const native = requireNativeModule<GapwiseDeviceCryptoNativeModule>('GapwiseDeviceCrypto');

export function generateDeviceKeyPair(): GeneratedDeviceKeyPair {
  return JSON.parse(native.generateDeviceKeyPair()) as GeneratedDeviceKeyPair;
}

export function decryptWrappedKey(privateKeyAlias: string, wrappedKeyBase64: string): string {
  return native.decryptWrappedKey(privateKeyAlias, wrappedKeyBase64);
}

export function importAesKey(keyBase64: string): string {
  return native.importAesKey(keyBase64);
}

export function deleteAesKey(handle: string): void {
  native.deleteAesKey(handle);
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

export function decryptJsonRecord(
  handle: string,
  record: EncryptedRecord,
  additionalDataUtf8: string,
): string {
  return native.decryptJsonRecord(handle, JSON.stringify(record), additionalDataUtf8);
}
