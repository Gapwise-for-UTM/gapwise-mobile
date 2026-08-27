import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import * as Linking from "expo-linking";
import { getPublicSupabaseConfig } from "./config";
import {
  refreshSession,
  requestMagicLink as sendMagicLink,
  revokeSession,
  sessionFromCallback,
} from "./client";
import { authFailureMessage } from "./model";
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

export function AuthProvider({ children }: PropsWithChildren) {
  const configured = Boolean(getPublicSupabaseConfig());
  const [state, setState] = useState<AuthState>({ status: "restoring", message: null });

  const installSession = useCallback(async (session: AuthSession) => {
    await writeStoredSession(session);
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
        setState({ status: "guest", message: "Account sign-in is not configured in this build. Your local timetable is unchanged." });
        return;
      }
      if (stored.expiresAt > Date.now() + REFRESH_SKEW_MS) {
        setState({ status: "authenticated", session: stored, message: null });
        return;
      }
      const refreshed = await refreshSession(stored.refreshToken);
      await installSession(refreshed);
    } catch (error) {
      const revoked = error instanceof Error && /revoked|401/i.test(error.message);
      if (revoked) await clearStoredSession().catch(() => undefined);
      setState({
        status: "guest",
        message: revoked ? authFailureMessage("revoked") : authFailureMessage("restore"),
      });
    }
  }, [configured, installSession]);

  const handleUrl = useCallback(
    async (url: string) => {
      if (!url.startsWith("gapwise://auth/callback")) return;
      setState({ status: "restoring", message: null });
      try {
        const session = await sessionFromCallback(url);
        const existing = await readStoredSession().catch(() => null);
        if (existing && existing.user.id !== session.user.id) {
          await clearStoredSession();
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
    const subscription = Linking.addEventListener("url", ({ url }) => void handleUrl(url));
    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });
    return () => subscription.remove();
  }, [handleUrl, restoreStored]);

  const requestMagicLink = useCallback(async (email: string) => {
    try {
      await sendMagicLink(email);
      setState((current) => ({ ...current, message: "Check your email for the Gapwise sign-in link. Your local timetable stays on this device while you sign in." }));
    } catch (error) {
      const offline = error instanceof TypeError;
      setState((current) => ({
        ...current,
        message: offline ? authFailureMessage("offline") : error instanceof Error ? error.message : "Sign-in could not start.",
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const session = state.status === "authenticated" ? state.session : null;
    await clearStoredSession();
    setState({ status: "guest", message: "Signed out. Local timetable data remains on this device." });
    if (session) await revokeSession(session.accessToken).catch(() => undefined);
  }, [state]);

  const dismissMessage = useCallback(() => {
    setState((current) => ({ ...current, message: null }));
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
