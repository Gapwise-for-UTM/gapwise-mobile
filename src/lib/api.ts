import Constants from "expo-constants";
import { fetch } from "expo/fetch";
import { withRequestTimeout } from "./request-timeout";

const configuredBase =
  process.env.EXPO_PUBLIC_GAPWISE_API_BASE_URL ??
  Constants.expoConfig?.extra?.apiBaseUrl;
export const GAPWISE_API_BASE_URL = String(
  configuredBase ?? "https://api.gapwise.ca/v1",
).replace(/\/$/, "");

export async function gapwiseFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await withRequestTimeout(
    (signal) =>
      fetch(`${GAPWISE_API_BASE_URL}/${path.replace(/^\//, "")}`, {
        ...init,
        signal,
        headers: { Accept: "application/json", ...init?.headers },
      }),
    { timeoutMessage: "Gapwise API request timed out." },
  );

  if (!response.ok) {
    throw new Error(`Gapwise API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}
