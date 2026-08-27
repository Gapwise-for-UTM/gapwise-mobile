import * as SecureStore from "expo-secure-store";
import type { AuthSession } from "./types";

const SESSION_KEY = "gapwise.mobile.auth.session.v1";
const SESSION_VERSION = 1;

type StoredSession = {
  version: 1;
  session: AuthSession;
};

function validSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AuthSession>;
  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.refreshToken === "string" &&
    session.refreshToken.length > 0 &&
    typeof session.expiresAt === "number" &&
    Number.isFinite(session.expiresAt) &&
    Boolean(session.user) &&
    typeof session.user?.id === "string" &&
    session.user.id.length > 0 &&
    (session.user.email === null || typeof session.user.email === "string")
  );
}

export async function readStoredSession(): Promise<AuthSession | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) return null;
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("Stored auth session is malformed.");
  const candidate = parsed as Partial<StoredSession>;
  if (candidate.version !== SESSION_VERSION || !validSession(candidate.session)) {
    throw new Error("Stored auth session is unsupported.");
  }
  return candidate.session;
}

export async function writeStoredSession(session: AuthSession) {
  const payload: StoredSession = { version: SESSION_VERSION, session };
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(payload), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearStoredSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
