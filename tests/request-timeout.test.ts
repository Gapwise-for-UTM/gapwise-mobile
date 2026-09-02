import assert from "node:assert/strict";
import test from "node:test";
import { withRequestTimeout } from "../src/lib/request-timeout.ts";

test("withRequestTimeout returns successful operations unchanged", async () => {
  const value = await withRequestTimeout(
    async (signal) => {
      assert.equal(signal.aborted, false);
      return "ok";
    },
    { timeoutMs: 50 },
  );

  assert.equal(value, "ok");
});

test("withRequestTimeout aborts a hung operation and returns a bounded error", async () => {
  await assert.rejects(
    () =>
      withRequestTimeout(
        (signal) =>
          new Promise<never>((_resolve, reject) => {
            signal.addEventListener(
              "abort",
              () => reject(new DOMException("Aborted", "AbortError")),
              { once: true },
            );
          }),
        { timeoutMs: 5, timeoutMessage: "bounded timeout" },
      ),
    /bounded timeout/,
  );
});

test("withRequestTimeout preserves caller cancellation", async () => {
  const caller = new AbortController();
  const pending = withRequestTimeout(
    (signal) =>
      new Promise<never>((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        );
      }),
    { timeoutMs: 1_000, signal: caller.signal },
  );

  caller.abort();
  await assert.rejects(
    pending,
    (error: unknown) =>
      error instanceof DOMException && error.name === "AbortError",
  );
});

test("withRequestTimeout rejects invalid timeout values before starting work", async () => {
  let started = false;
  await assert.rejects(
    () =>
      withRequestTimeout(
        async () => {
          started = true;
          return "unreachable";
        },
        { timeoutMs: 0 },
      ),
    /positive finite number/,
  );
  assert.equal(started, false);
});
