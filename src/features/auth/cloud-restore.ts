import {
  getOrCreatePublicJwk,
  unwrapDataKey,
  decryptJsonRecord,
} from "../../../modules/gapwise-device-crypto";
import { getPublicSupabaseConfig } from "./config";
import {
  byteaHexToBase64Url,
  encryptedPrivateAad,
  parseDeviceKeyBundle,
  parseEncryptedPrivateRow,
  parsePrivateSchedulePayload,
  type EncryptedPrivateRow,
} from "./cloud-restore-model";
import type { AuthSession } from "./types";
import type { Meeting } from "../timetable/model";

const DEFAULT_API_ORIGIN = "https://gapwise.ca";
const MAX_BROKER_BYTES = 8 * 1024;
const MAX_ROW_BYTES = 512 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;

type CloudRestoreResult =
  { kind: "empty" } | { kind: "cloud"; meetings: Meeting[]; updatedAt: string };

function apiOrigin() {
  const configured = process.env.EXPO_PUBLIC_GAPWISE_API_URL?.trim();
  const value = (configured || DEFAULT_API_ORIGIN).replace(/\/$/, "");
  if (!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(value)) {
    throw new Error("Gapwise API URL must be an HTTPS origin.");
  }
  return value;
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  callerSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  callerSignal?.addEventListener("abort", abort, { once: true });
  try {
    const response = await fetch(input, { ...init, signal: controller.signal });
    return response;
  } catch (error) {
    if (timedOut && !callerSignal?.aborted) {
      throw new Error("Encrypted cloud restore timed out.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
    callerSignal?.removeEventListener("abort", abort);
  }
}

async function readBoundedJson(response: Response, maximumBytes: number) {
  const declared = response.headers.get("content-length");
  if (declared && Number(declared) > maximumBytes) {
    throw new Error("Encrypted cloud response is too large.");
  }
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maximumBytes) {
    throw new Error("Encrypted cloud response is too large.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("Encrypted cloud response is malformed.");
  }
}

async function requestKeyBundle(session: AuthSession, signal?: AbortSignal) {
  const devicePublicKey = getOrCreatePublicJwk(session.user.id);
  const response = await fetchWithTimeout(
    `${apiOrigin()}/api/key-broker`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ devicePublicKey }),
      redirect: "error",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    },
    signal,
  );
  const body = await readBoundedJson(response, MAX_BROKER_BYTES);
  if (!response.ok) throw new Error("Encrypted key setup is unavailable.");
  return parseDeviceKeyBundle(body);
}

async function loadPrivateRow(
  session: AuthSession,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const config = getPublicSupabaseConfig();
  if (!config) throw new Error("Encrypted cloud restore is not configured.");
  const query = new URL(`${config.url}/rest/v1/encrypted_private_data`);
  query.searchParams.set("select", "*");
  query.searchParams.set("user_id", `eq.${session.user.id}`);
  query.searchParams.set("limit", "2");
  const response = await fetchWithTimeout(
    query.toString(),
    {
      method: "GET",
      headers: {
        apikey: config.publishableKey,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/json",
      },
      redirect: "error",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    },
    signal,
  );
  const body = await readBoundedJson(response, MAX_ROW_BYTES);
  if (!response.ok) throw new Error("Encrypted cloud data is unavailable.");
  if (!Array.isArray(body))
    throw new Error("Encrypted cloud response is malformed.");
  if (body.length === 0) return null;
  if (body.length !== 1) throw new Error("Encrypted cloud state is ambiguous.");
  return body[0];
}

function decryptPrivateRow(
  session: AuthSession,
  row: EncryptedPrivateRow,
  wrappedDek: string,
) {
  const handle = unwrapDataKey(session.user.id, row.key_id, wrappedDek);
  return decryptJsonRecord(
    handle,
    {
      ciphertext: byteaHexToBase64Url(row.ciphertext, 256 * 1024 + 16, false),
      nonce: byteaHexToBase64Url(row.nonce, 12, true),
    },
    encryptedPrivateAad(row),
  );
}

export async function restoreEncryptedCloudTimetable(
  session: AuthSession,
  signal?: AbortSignal,
): Promise<CloudRestoreResult> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const bundle = await requestKeyBundle(session, signal);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const rawRow = await loadPrivateRow(session, signal);
  if (rawRow === null) return { kind: "empty" };
  const row = parseEncryptedPrivateRow(rawRow, session.user.id, bundle);
  const plaintext = decryptPrivateRow(
    session,
    row,
    bundle.privateData.wrappedDek,
  );
  const meetings = parsePrivateSchedulePayload(plaintext);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return { kind: "cloud", meetings, updatedAt: row.updated_at };
}
