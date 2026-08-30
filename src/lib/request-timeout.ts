export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: {
    timeoutMs?: number;
    timeoutMessage?: string;
  } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Request timeout must be a positive finite number.");
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (timedOut) {
      throw new Error(options.timeoutMessage ?? "Network request timed out.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timer);
  }
}
