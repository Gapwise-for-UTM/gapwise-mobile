export const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: {
    timeoutMs?: number;
    timeoutMessage?: string;
    signal?: AbortSignal | null;
  } = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Request timeout must be a positive finite number.");
  }
  if (options.signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timer = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await operation(controller.signal);
  } catch (error) {
    if (timedOut && !options.signal?.aborted) {
      throw new Error(options.timeoutMessage ?? "Network request timed out.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timer);
    options.signal?.removeEventListener("abort", abortFromCaller);
  }
}
