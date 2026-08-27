import assert from "node:assert/strict";
import test from "node:test";
import {
  accountSwitchRequiresIsolation,
  authFailureMessage,
  chooseRestoration,
  shouldReplaceLocalTimetable,
} from "../src/features/auth/model.ts";

test("empty cloud state preserves recoverable local timetable", () => {
  const input = { localHasTimetable: true, cloudOutcome: "empty" as const };
  assert.deepEqual(chooseRestoration(input), { kind: "local", hasCloudState: false });
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
