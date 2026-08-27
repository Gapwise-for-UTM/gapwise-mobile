import type { Meeting } from "../timetable/model";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const HEX_PATTERN = /^[0-9a-f]+$/i;
const CRYPTO_VERSION = 1;
const PRIVATE_DATA_SCHEMA_VERSIONS = new Set([1, 2]);
const MAX_PRIVATE_CIPHERTEXT_BYTES = 256 * 1024 + 16;
const WEEKDAYS = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]);
const TERMS = new Set(["Fall", "Winter", "Summer"]);
const ACTIVITY_TYPES = new Set(["LEC", "TUT", "PRA", "OTHER"]);

export type DeviceKeyBundle = {
  cryptoVersion: 1;
  keyVersion: 1;
  subjectId: string;
  privateData: { keyId: string; wrappedDek: string };
};

export type EncryptedPrivateRow = {
  user_id: string;
  subject_id: string;
  record_id: string;
  key_id: string;
  crypto_version: number;
  schema_version: number;
  revision: number;
  ciphertext: string;
  nonce: string;
  updated_at: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
}

function requireUuid(value: unknown, name: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`Invalid ${name}.`);
  }
  return value;
}

function requirePositiveInteger(value: unknown, name: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new Error(`Invalid ${name}.`);
  }
  return value as number;
}

function decodeBase64UrlLength(value: string): number {
  if (!BASE64URL_PATTERN.test(value)) throw new Error("Malformed base64url value.");
  const remainder = value.length % 4;
  if (remainder === 1) throw new Error("Malformed base64url value.");
  const padding = remainder === 0 ? 0 : 4 - remainder;
  return ((value.length + padding) / 4) * 3 - padding;
}

function parseWrappedKey(value: unknown) {
  if (!isRecord(value) || !exactKeys(value, ["keyId", "wrappedDek"])) {
    throw new Error("Key broker response is malformed.");
  }
  const keyId = requireUuid(value.keyId, "key ID");
  if (
    typeof value.wrappedDek !== "string" ||
    decodeBase64UrlLength(value.wrappedDek) !== 256
  ) {
    throw new Error("Key broker response is malformed.");
  }
  return { keyId, wrappedDek: value.wrappedDek };
}

export function parseDeviceKeyBundle(value: unknown): DeviceKeyBundle {
  if (
    !isRecord(value) ||
    !exactKeys(value, [
      "cryptoVersion",
      "friendAvailability",
      "keyVersion",
      "privateData",
      "subjectId",
    ]) ||
    value.cryptoVersion !== CRYPTO_VERSION ||
    value.keyVersion !== 1
  ) {
    throw new Error("Key broker response is malformed.");
  }
  // Parse the unused availability envelope too so a malformed broker response
  // cannot be partially accepted by mobile while web rejects it.
  parseWrappedKey(value.friendAvailability);
  return {
    cryptoVersion: 1,
    keyVersion: 1,
    subjectId: requireUuid(value.subjectId, "subject ID"),
    privateData: parseWrappedKey(value.privateData),
  };
}

export function parseEncryptedPrivateRow(
  value: unknown,
  expectedUserId: string,
  bundle: DeviceKeyBundle,
): EncryptedPrivateRow {
  if (!isRecord(value)) throw new Error("Encrypted private data is malformed.");
  const row = value as Record<string, unknown>;
  const userId = requireUuid(row.user_id, "private-data owner");
  const subjectId = requireUuid(row.subject_id, "subject ID");
  const recordId = requireUuid(row.record_id, "record ID");
  const keyId = requireUuid(row.key_id, "key ID");
  const cryptoVersion = requirePositiveInteger(row.crypto_version, "crypto version");
  const schemaVersion = requirePositiveInteger(row.schema_version, "schema version");
  const revision = requirePositiveInteger(row.revision, "revision");
  if (
    userId !== expectedUserId ||
    subjectId !== bundle.subjectId ||
    keyId !== bundle.privateData.keyId ||
    cryptoVersion !== CRYPTO_VERSION ||
    !PRIVATE_DATA_SCHEMA_VERSIONS.has(schemaVersion)
  ) {
    throw new Error("Encrypted private data context mismatch.");
  }
  if (typeof row.updated_at !== "string" || !Number.isFinite(Date.parse(row.updated_at))) {
    throw new Error("Encrypted private data timestamp is malformed.");
  }
  if (typeof row.ciphertext !== "string" || typeof row.nonce !== "string") {
    throw new Error("Encrypted private data is malformed.");
  }
  byteaHexToBase64Url(row.ciphertext, MAX_PRIVATE_CIPHERTEXT_BYTES, false);
  byteaHexToBase64Url(row.nonce, 12, true);
  return {
    user_id: userId,
    subject_id: subjectId,
    record_id: recordId,
    key_id: keyId,
    crypto_version: cryptoVersion,
    schema_version: schemaVersion,
    revision,
    ciphertext: row.ciphertext,
    nonce: row.nonce,
    updated_at: row.updated_at,
  };
}

export function encryptedPrivateAad(row: EncryptedPrivateRow): string {
  return JSON.stringify([
    "gapwise",
    "private-data",
    row.crypto_version,
    row.schema_version,
    row.subject_id,
    row.record_id,
    row.key_id,
    row.revision,
  ]);
}

export function byteaHexToBase64Url(
  value: string,
  maximumBytes: number,
  exact: boolean,
): string {
  const hex = value.startsWith("\\x") ? value.slice(2) : value;
  if (hex.length % 2 !== 0 || !HEX_PATTERN.test(hex)) {
    throw new Error("Encrypted bytea value is malformed.");
  }
  const byteLength = hex.length / 2;
  if ((exact && byteLength !== maximumBytes) || (!exact && byteLength > maximumBytes)) {
    throw new Error("Encrypted bytea value has an invalid length.");
  }
  const bytes = new Uint8Array(byteLength);
  for (let index = 0; index < byteLength; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]!);
  }
  return globalThis
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function requiredText(value: unknown, maximum: number): string {
  if (typeof value !== "string" || value.length < 1 || value.length > maximum) {
    throw new Error("Cloud timetable contains invalid text.");
  }
  return value;
}

function nullableText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length > maximum) {
    throw new Error("Cloud timetable contains invalid location data.");
  }
  return value;
}

function parseMeeting(value: unknown): Meeting {
  if (!isRecord(value)) throw new Error("Cloud timetable is malformed.");
  if (
    !ACTIVITY_TYPES.has(String(value.activityType)) ||
    !WEEKDAYS.has(String(value.weekday)) ||
    !TERMS.has(String(value.term)) ||
    !Number.isInteger(value.startTime) ||
    !Number.isInteger(value.endTime) ||
    (value.startTime as number) < 0 ||
    (value.endTime as number) > 24 * 60 ||
    (value.endTime as number) <= (value.startTime as number) ||
    typeof value.locationUnknown !== "boolean"
  ) {
    throw new Error("Cloud timetable is malformed.");
  }
  return {
    id: requiredText(value.id, 240),
    courseCode: requiredText(value.courseCode, 64),
    activityType: value.activityType as Meeting["activityType"],
    sectionCode: requiredText(value.sectionCode, 64),
    courseName: requiredText(value.courseName, 240),
    startTime: value.startTime as number,
    endTime: value.endTime as number,
    weekday: value.weekday as Meeting["weekday"],
    buildingCode: nullableText(value.buildingCode, 64),
    room: nullableText(value.room, 64),
    term: value.term as Meeting["term"],
    locationUnknown: value.locationUnknown,
  };
}

export function parsePrivateSchedulePayload(plaintext: string): Meeting[] {
  let value: unknown;
  try {
    value = JSON.parse(plaintext) as unknown;
  } catch {
    throw new Error("Decrypted private data is malformed.");
  }
  if (!isRecord(value) || !PRIVATE_DATA_SCHEMA_VERSIONS.has(Number(value.schemaVersion))) {
    throw new Error("Decrypted private data schema is unsupported.");
  }
  if (!Array.isArray(value.schedule) || value.schedule.length > 2_000) {
    throw new Error("Cloud timetable is malformed.");
  }
  return value.schedule.map(parseMeeting);
}
