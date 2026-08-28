import { AUTH_CALLBACK_URL, getPublicSupabaseConfig } from "./config";
import { buildMagicLinkRequest, isAuthCallbackUrl } from "./model";
import type { AuthSession, AuthUser } from "./types";

function requireConfig() {
  const config = getPublicSupabaseConfig();
  if (!config) {
    throw new Error("Account sign-in is not configured for this build.");
  }
  return config;
}

function authHeaders() {
  const config = requireConfig();
  return {
    apikey: config.publishableKey,
    "Content-Type": "application/json",
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("The authentication service returned an invalid response.");
  }
}

export async function requestMagicLink(email: string) {
  const config = requireConfig();
  const request = buildMagicLinkRequest(config.url, email, AUTH_CALLBACK_URL);
  const response = await fetch(request.url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(request.body),
  });
  if (!response.ok) throw new Error("Gapwise could not send the sign-in link.");
}

function parseFragment(url: string) {
  const marker = url.indexOf("#");
  const queryMarker = url.indexOf("?");
  const raw =
    marker >= 0
      ? url.slice(marker + 1)
      : queryMarker >= 0
        ? url.slice(queryMarker + 1)
        : "";
  const result: Record<string, string> = {};
  for (const pair of raw.split("&")) {
    const [key, value] = pair.split("=", 2);
    if (key && value) {
      result[decodeURIComponent(key)] = decodeURIComponent(
        value.replace(/\+/g, " "),
      );
    }
  }
  return result;
}

function parseUser(value: unknown): AuthUser {
  if (!value || typeof value !== "object") {
    throw new Error("Authenticated user is missing.");
  }
  const user = value as { id?: unknown; email?: unknown };
  if (typeof user.id !== "string" || !user.id) {
    throw new Error("Authenticated user is invalid.");
  }
  return {
    id: user.id,
    email: typeof user.email === "string" ? user.email : null,
  };
}

export async function sessionFromCallback(url: string): Promise<AuthSession> {
  if (!isAuthCallbackUrl(url, AUTH_CALLBACK_URL)) {
    throw new Error("Unexpected authentication callback.");
  }
  const values = parseFragment(url);
  const accessToken = values["access_token"];
  const refreshToken = values["refresh_token"];
  const expiresIn = Number(values["expires_in"] ?? "0");
  if (
    !accessToken ||
    !refreshToken ||
    !Number.isFinite(expiresIn) ||
    expiresIn <= 0
  ) {
    throw new Error("The sign-in callback did not contain a valid session.");
  }
  const user = await getUser(accessToken);
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    user,
  };
}

export async function refreshSession(
  refreshToken: string,
): Promise<AuthSession> {
  const config = requireConfig();
  const response = await fetch(
    `${config.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  const body = (await readJson(response)) as Record<string, unknown> | null;
  if (!response.ok || !body) {
    if (response.status === 400 || response.status === 401) {
      throw new Error("Session revoked.");
    }
    throw new Error("Session refresh failed.");
  }
  const accessToken = body["access_token"];
  const nextRefresh = body["refresh_token"];
  const expiresIn = Number(body["expires_in"] ?? 0);
  if (
    typeof accessToken !== "string" ||
    typeof nextRefresh !== "string" ||
    expiresIn <= 0
  ) {
    throw new Error("Session refresh returned invalid credentials.");
  }
  const user = parseUser(body["user"] ?? (await getUser(accessToken)));
  return {
    accessToken,
    refreshToken: nextRefresh,
    expiresAt: Date.now() + expiresIn * 1000,
    user,
  };
}

export async function getUser(accessToken: string): Promise<AuthUser> {
  const config = requireConfig();
  const response = await fetch(`${config.url}/auth/v1/user`, {
    headers: { ...authHeaders(), Authorization: `Bearer ${accessToken}` },
  });
  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Session revoked."
        : "Could not verify session.",
    );
  }
  return parseUser(body);
}

export async function revokeSession(accessToken: string) {
  const config = requireConfig();
  const response = await fetch(`${config.url}/auth/v1/logout`, {
    method: "POST",
    headers: { ...authHeaders(), Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok && response.status !== 401) {
    throw new Error("Remote sign-out could not finish.");
  }
}
