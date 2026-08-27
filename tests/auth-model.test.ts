import assert from "node:assert/strict";
import test from "node:test";
import { isAuthCallbackUrl, requestMagicLink } from "../src/features/auth/client.ts";
import {
  accountSwitchRequiresIsolation,
  authFailureMessage,
  chooseRestoration,
  shouldReplaceLocalTimetable,
} from "../src/features/auth/model.ts";

test("empty cloud state preserves recoverable local timetable", () => {
  const input = { localHasTimetable: true, cloudOutcome: "empty" as const };
  assert.deepEqual(chooseRestoration(input), {
    kind: "local",
    hasCloudState: false,
  });
  assert.equal(shouldReplaceLocalTimetable(input), false);
});

test("failed and interrupted restore never replace local state", () => {
  for (const cloudOutcome of ["failed", "interrupted"] as const) {
    assert.equal(
      shouldReplaceLocalTimetable({ localHasTimetable: true, cloudOutcome }),
      false,
    );
  }
});

test("authoritative available cloud state is the only replacement case", () => {
  const input = {
    localHasTimetable: true,
    cloudOutcome: "available" as const,
  };
  assert.equal(chooseRestoration(input).kind, "cloud");
  assert.equal(shouldReplaceLocalTimetable(input), true);
});

test("account switches require isolation while guest transitions do not", () => {
  assert.equal(accountSwitchRequiresIsolation("user-a", "user-b"), true);
  assert.equal(accountSwitchRequiresIsolation("user-a", "user-a"), false);
  assert.equal(accountSwitchRequiresIsolation(null, "user-a"), false);
  assert.equal(accountSwitchRequiresIsolation("user-a", null), false);
});

test("auth failures explicitly promise local continuity", () => {
  for (const kind of ["offline", "expired", "revoked", "restore"] as const) {
    assert.match(authFailureMessage(kind), /local|timetable/i);
  }
});

test("auth callback matching accepts only the exact registered route", () => {
  assert.equal(isAuthCallbackUrl("gapwise://auth/callback"), true);
  assert.equal(isAuthCallbackUrl("gapwise://auth/callback#access_token=a"), true);
  assert.equal(isAuthCallbackUrl("gapwise://auth/callback?code=a"), true);
  assert.equal(isAuthCallbackUrl("gapwise://auth/callback-attacker#access_token=a"), false);
  assert.equal(isAuthCallbackUrl("https://gapwise.ca/auth/callback"), false);
});

test("magic-link request uses the supported GoTrue redirect query wire format", async () => {
  const previousUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const previousFetch = globalThis.fetch;
  process.env.EXPO_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

  let capturedUrl = "";
  let capturedInit: RequestInit | undefined;
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(null, { status: 200 });
  };

  try {
    await requestMagicLink(" Student@Example.com ");
    assert.equal(
      capturedUrl,
      "https://example.supabase.co/auth/v1/otp?redirect_to=gapwise%3A%2F%2Fauth%2Fcallback",
    );
    assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
      email: "student@example.com",
      data: {},
      create_user: true,
    });
    assert.equal(
      new Headers(capturedInit?.headers).get("apikey"),
      "sb_publishable_test",
    );
  } finally {
    globalThis.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});
