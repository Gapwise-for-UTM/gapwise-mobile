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

export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  if (/service[_-]?role|secret/i.test(publishableKey)) {
    throw new Error(
      "Privileged Supabase credentials must never be bundled in the mobile app.",
    );
  }
  return { url: normalizeUrl(url), publishableKey };
}

export const AUTH_CALLBACK_URL = "gapwise://auth/callback";
