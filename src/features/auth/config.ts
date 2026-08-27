export type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!/^https:\/\/[a-z0-9.-]+$/i.test(trimmed)) {
    throw new Error("Supabase URL must be a public HTTPS origin.");
  }
  return trimmed;
}

function validatePublishableKey(value: string) {
  const key = value.trim();
  if (!key.startsWith("sb_publishable_") || key.length < 24) {
    throw new Error(
      "Gapwise Mobile accepts only modern Supabase publishable client keys. Privileged, secret, and legacy JWT credentials must not be bundled.",
    );
  }
  return key;
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  return {
    url: normalizeUrl(url),
    publishableKey: validatePublishableKey(publishableKey),
  };
}

export const AUTH_CALLBACK_URL = "gapwise://auth/callback";
