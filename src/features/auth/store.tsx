import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import * as Linking from "expo-linking";
import { clearAccount } from "../../../modules/gapwise-device-crypto";
import { useTimetable } from "../timetable/store";
import { restoreEncryptedCloudTimetable } from "./cloud-restore";
import { getPublicSupabaseConfig } from "./config";
import {
  refreshSession,
  requestMagicLink as sendMagicLink,
  revokeSession,
  sessionFromCallback,
} from "./client";
import { authFailureMessage, isAuthCallbackUrl } from "./model";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from "./session";
import type { AuthSession, AuthState } from "./types";

type AuthContextValue = {
  state: AuthState;
  configured: boolean;
  requestMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  dismissMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_SKEW_MS = 60_000;
const AUTH_CALLBACK_URL = "gapwise://auth/callback";

function clearNativeAccount(accountId: string) {
  try {
    clearAccount(accountId);
  } catch {
    // Session cleanup must still succeed if native key deletion is unavailable.
    // A later account-scoped lookup cannot reuse handles from another account.
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = Boolean(getPublicSupabaseConfig());
  const { hydrated: timetableHydrated, replaceFromCloud } = useTimetable();
  const restoredCloudAccount = useRef<string | null>(null);
  const [state, setState] = useState<AuthState>({
    status: "restoring",
    message: null,
  });

  const installSession = useCallback(async (session: AuthSession) => {
    await writeStoredSession(session);
    restoredCloudAccount.current = null;
    setState({ status: "authenticated", session, message: null });
  }, []);

  const restoreStored = useCallback(async () => {
    try {
      const stored = await readStoredSession();
      if (!stored) {
        setState({ status: "guest", message: null });
        return;
      }
      if (!configured) {
        setState({
          status: "guest",
          message:
            "Account sign-in is not configured in this build. Your local timetable is unchanged.",
        });
        return;
      }
      if (stored.expiresAt > Date.now() + REFRESH_SKEW_MS) {
        restoredCloudAccount.current = null;
        setState({ status: "authenticated", session: stored, message: null });
        return;
      }
      const refreshed = await refreshSession(stored.refreshToken);
      await installSession(refreshed);
    } catch (error) {
      const revoked =
        error instanceof Error && /revoked|401/i.test(error.message);
      if (revoked) {
        const stored = await readStoredSession().catch(() => null);
        await clearStoredSession().catch(() => undefined);
        if (stored) clearNativeAccount(stored.user.id);
      }
      setState({
        status: "guest",
        message: revoked
          ? authFailureMessage("revoked")
          : authFailureMessage("restore"),
      });
    }
  }, [configured, installSession]);

  const handleUrl = useCallback(
    async (url: string) => {
      if (!isAuthCallbackUrl(url, AUTH_CALLBACK_URL)) return;
      setState({ status: "restoring", message: null });
      try {
        const session = await sessionFromCallback(url);
        const existing = await readStoredSession().catch(() => null);
        if (existing && existing.user.id !== session.user.id) {
          await clearStoredSession();
          clearNativeAccount(existing.user.id);
        }
        await installSession(session);
      } catch {
        setState({ status: "guest", message: authFailureMessage("restore") });
      }
    },
    [installSession],
  );

  useEffect(() => {
    void restoreStored();
    const subscription = Linking.addEventListener(
      "url",
      ({ url }) => void handleUrl(url),
    );
    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });
    return () => subscription.remove();
  }, [handleUrl, restoreStored]);

  useEffect(() => {
    if (!timetableHydrated || state.status !== "authenticated") return;
    const session = state.session;
    if (restoredCloudAccount.current === session.user.id) return;
    restoredCloudAccount.current = session.user.id;
    const controller = new AbortController();
    void restoreEncryptedCloudTimetable(session, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        if (result.kind === "cloud") replaceFromCloud(result.meetings);
        setState((current) =>
          current.status === "authenticated" &&
          current.session.user.id === session.user.id
            ? { ...current, message: null }
            : current,
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const offline = error instanceof TypeError;
        setState((current) =>
          current.status === "authenticated" &&
          current.session.user.id === session.user.id
            ? {
                ...current,
                message: offline
                  ? "Cloud timetable is offline. Your local timetable is unchanged."
                  : "Cloud timetable could not be restored. Your local timetable is unchanged.",
              }
            : current,
        );
      });
    return () => controller.abort();
  }, [replaceFromCloud, state, timetableHydrated]);

  const requestMagicLink = useCallback(async (email: string) => {
    try {
      await sendMagicLink(email);
      setState((current) => ({
        ...current,
        message:
          "Check your email for the Gapwise sign-in link. Your local timetable stays on this device while you sign in.",
      }));
    } catch (error) {
      const offline = error instanceof TypeError;
      setState((current) => ({
        ...current,
        message: offline
          ? authFailureMessage("offline")
          : error instanceof Error
            ? error.message
            : "Sign-in could not start.",
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const session = state.status === "authenticated" ? state.session : null;
    await clearStoredSession();
    restoredCloudAccount.current = null;
    if (session) clearNativeAccount(session.user.id);
    setState({
      status: "guest",
      message: "Signed out. Local timetable data remains on this device.",
    });
    if (session)
      await revokeSession(session.accessToken).catch(() => undefined);
  }, [state]);

  const dismissMessage = useCallback(() => {
    setState((current) =>
      current.status === "error"
        ? { status: "guest", message: null }
        : { ...current, message: null },
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ state, configured, requestMagicLink, signOut, dismissMessage }),
    [configured, dismissMessage, requestMagicLink, signOut, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
