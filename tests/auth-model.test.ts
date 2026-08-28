import assert from "node:assert/strict";
import test from "node:test";
import {
  accountSwitchRequiresIsolation,
  authFailureMessage,
  buildMagicLinkRequest,
  chooseRestoration,
  isAuthCallbackUrl,
  shouldReplaceLocalTimetable,
} from "../src/features/auth/model.ts";

const CALLBACK_URL = "gapwise://auth/callback";

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
  const input = { localHasTimetable: true, cloudOutcome: "available" as const };
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
  assert.equal(isAuthCallbackUrl(CALLBACK_URL, CALLBACK_URL), true);
  assert.equal(
    isAuthCallbackUrl(`${CALLBACK_URL}#access_token=a`, CALLBACK_URL),
    true,
  );
  assert.equal(isAuthCallbackUrl(`${CALLBACK_URL}?code=a`, CALLBACK_URL), true);
  assert.equal(
    isAuthCallbackUrl(`${CALLBACK_URL}-other#access_token=a`, CALLBACK_URL),
    false,
  );
  assert.equal(
    isAuthCallbackUrl("https://gapwise.ca/auth/callback", CALLBACK_URL),
    false,
  );
});

test("magic-link request uses the supported GoTrue redirect query wire format", () => {
  assert.deepEqual(
    buildMagicLinkRequest(
      "https://example.supabase.co",
      " Student@Example.com ",
      CALLBACK_URL,
    ),
    {
      url: "https://example.supabase.co/auth/v1/otp?redirect_to=gapwise%3A%2F%2Fauth%2Fcallback",
      body: {
        email: "student@example.com",
        data: {},
        create_user: true,
      },
    },
  );
});
