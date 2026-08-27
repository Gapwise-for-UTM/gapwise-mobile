import assert from "node:assert/strict";
import test from "node:test";
import {
  byteaHexToBase64Url,
  encryptedPrivateAad,
  parseDeviceKeyBundle,
  parseEncryptedPrivateRow,
  parsePrivateSchedulePayload,
} from "../src/features/auth/cloud-restore-model.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const SUBJECT_ID = "22222222-2222-4222-8222-222222222222";
const KEY_ID = "33333333-3333-4333-8333-333333333333";
const RECORD_ID = "44444444-4444-4444-8444-444444444444";

function bundle() {
  return parseDeviceKeyBundle({
    cryptoVersion: 1,
    keyVersion: 1,
    subjectId: SUBJECT_ID,
    privateData: { keyId: KEY_ID, wrappedDek: "A".repeat(342) },
    friendAvailability: {
      keyId: "55555555-5555-4555-8555-555555555555",
      wrappedDek: "A".repeat(342),
    },
  });
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    user_id: USER_ID,
    subject_id: SUBJECT_ID,
    record_id: RECORD_ID,
    key_id: KEY_ID,
    crypto_version: 1,
    schema_version: 2,
    revision: 7,
    ciphertext: "\\x00112233445566778899aabbccddeeff",
    nonce: "\\x000102030405060708090a0b",
    updated_at: "2026-08-27T23:00:00.000Z",
    ...overrides,
  };
}

test("parses the exact canonical key broker envelope", () => {
  const parsed = bundle();
  assert.equal(parsed.subjectId, SUBJECT_ID);
  assert.equal(parsed.privateData.keyId, KEY_ID);
  assert.equal(parsed.privateData.wrappedDek.length, 342);
});

test("rejects malformed or partial key broker responses", () => {
  assert.throws(() =>
    parseDeviceKeyBundle({
      cryptoVersion: 1,
      keyVersion: 1,
      subjectId: SUBJECT_ID,
      privateData: { keyId: KEY_ID, wrappedDek: "A".repeat(342) },
    }),
  );
  assert.throws(() =>
    parseDeviceKeyBundle({
      cryptoVersion: 1,
      keyVersion: 1,
      subjectId: SUBJECT_ID,
      privateData: { keyId: KEY_ID, wrappedDek: "A".repeat(341) },
      friendAvailability: {
        keyId: "55555555-5555-4555-8555-555555555555",
        wrappedDek: "A".repeat(342),
      },
    }),
  );
});

test("rejects wrong-account and wrong-key encrypted rows before decryption", () => {
  assert.throws(() =>
    parseEncryptedPrivateRow(
      row({ user_id: "66666666-6666-4666-8666-666666666666" }),
      USER_ID,
      bundle(),
    ),
  );
  assert.throws(() =>
    parseEncryptedPrivateRow(
      row({ key_id: "77777777-7777-4777-8777-777777777777" }),
      USER_ID,
      bundle(),
    ),
  );
});

test("rejects malformed nonce and unsupported crypto metadata", () => {
  assert.throws(() =>
    parseEncryptedPrivateRow(row({ nonce: "\\x0011" }), USER_ID, bundle()),
  );
  assert.throws(() =>
    parseEncryptedPrivateRow(
      row({ crypto_version: 2 }),
      USER_ID,
      bundle(),
    ),
  );
});

test("builds byte-identical canonical private-data AAD", () => {
  const parsed = parseEncryptedPrivateRow(row(), USER_ID, bundle());
  assert.equal(
    encryptedPrivateAad(parsed),
    JSON.stringify([
      "gapwise",
      "private-data",
      1,
      2,
      SUBJECT_ID,
      RECORD_ID,
      KEY_ID,
      7,
    ]),
  );
});

test("converts Postgres bytea hex to base64url without padding", () => {
  assert.equal(byteaHexToBase64Url("\\x000102", 3, true), "AAEC");
  assert.throws(() => byteaHexToBase64Url("\\x0001", 3, true));
  assert.throws(() => byteaHexToBase64Url("\\x0g", 1, true));
});

test("accepts canonical timetable schedule and strips unsupported metadata", () => {
  const meetings = parsePrivateSchedulePayload(
    JSON.stringify({
      schemaVersion: 2,
      schedule: [
        {
          id: "meeting-1",
          courseCode: "CSC110Y5",
          activityType: "LEC",
          sectionCode: "LEC0101",
          courseName: "Foundations of Computer Science I",
          startTime: 600,
          endTime: 660,
          weekday: "Monday",
          buildingCode: "MN",
          room: "1210",
          term: "Fall",
          locationUnknown: false,
          notes: "web-only metadata",
        },
      ],
      personalItems: [],
      preferences: {},
      gapPreferences: {},
      academic: { coursework: [], blocks: [], proposalRevision: null },
    }),
  );
  assert.deepEqual(meetings, [
    {
      id: "meeting-1",
      courseCode: "CSC110Y5",
      activityType: "LEC",
      sectionCode: "LEC0101",
      courseName: "Foundations of Computer Science I",
      startTime: 600,
      endTime: 660,
      weekday: "Monday",
      buildingCode: "MN",
      room: "1210",
      term: "Fall",
      locationUnknown: false,
    },
  ]);
});

test("rejects malformed decrypted schedules instead of partially applying them", () => {
  assert.throws(() =>
    parsePrivateSchedulePayload(
      JSON.stringify({
        schemaVersion: 2,
        schedule: [
          {
            id: "meeting-1",
            courseCode: "CSC110Y5",
            activityType: "LEC",
            sectionCode: "LEC0101",
            courseName: "CSC110",
            startTime: 700,
            endTime: 600,
            weekday: "Monday",
            buildingCode: "MN",
            room: "1210",
            term: "Fall",
            locationUnknown: false,
          },
        ],
      }),
    ),
  );
});
