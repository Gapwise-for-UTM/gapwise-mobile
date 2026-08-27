import type { RestoreResult } from "./types";

export type RestoreDecisionInput = {
  localHasTimetable: boolean;
  cloudOutcome: "available" | "empty" | "failed" | "interrupted";
};

export function chooseRestoration(input: RestoreDecisionInput): RestoreResult {
  if (input.cloudOutcome === "available") {
    return { kind: "cloud", hasCloudState: true };
  }
  if (input.cloudOutcome === "failed") {
    return { kind: "local-after-cloud-failure", hasCloudState: false };
  }
  if (input.cloudOutcome === "interrupted") {
    return { kind: "local-after-interruption", hasCloudState: false };
  }
  return { kind: "local", hasCloudState: false };
}

export function shouldReplaceLocalTimetable(input: RestoreDecisionInput) {
  return input.cloudOutcome === "available";
}

export function accountSwitchRequiresIsolation(
  previousUserId: string | null,
  nextUserId: string | null,
) {
  return Boolean(previousUserId && nextUserId && previousUserId !== nextUserId);
}

export function isAuthCallbackUrl(url: string, callbackUrl: string) {
  return (
    url === callbackUrl ||
    url.startsWith(`${callbackUrl}?`) ||
    url.startsWith(`${callbackUrl}#`)
  );
}

export function buildMagicLinkRequest(
  baseUrl: string,
  email: string,
  callbackUrl: string,
) {
  const normalized = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  return {
    url: `${baseUrl}/auth/v1/otp?redirect_to=${encodeURIComponent(callbackUrl)}`,
    body: {
      email: normalized,
      data: {},
      create_user: true,
    },
  };
}

export function authFailureMessage(
  kind: "offline" | "expired" | "revoked" | "restore",
) {
  switch (kind) {
    case "offline":
      return "You are offline. Your local timetable stays available; account actions resume after reconnecting.";
    case "expired":
      return "Your session expired. Sign in again; local timetable data has not been removed.";
    case "revoked":
      return "This session is no longer valid. Sign in again; local timetable data remains on this device.";
    case "restore":
      return "Cloud restoration could not finish. Gapwise kept the recoverable local timetable instead of replacing it.";
  }
}
