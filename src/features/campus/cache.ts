import * as SecureStore from "expo-secure-store";
import { joinSecureStoreChunks, splitForSecureStore } from "./model";
import type { CampusSnapshot } from "./types";

const CACHE_META_KEY = "gapwise.mobile.campus.v1.meta";
const CACHE_CHUNK_PREFIX = "gapwise.mobile.campus.v1.chunk.";
const CACHE_CHUNK_SIZE = 1800;

type CacheMeta = { version: 1; chunks: number };

async function deleteChunks(count: number) {
  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(`${CACHE_CHUNK_PREFIX}${index}`),
    ),
  );
}

export async function readCampusCache(): Promise<CampusSnapshot | null> {
  const rawMeta = await SecureStore.getItemAsync(CACHE_META_KEY);
  if (!rawMeta) return null;

  let meta: CacheMeta;
  try {
    meta = JSON.parse(rawMeta) as CacheMeta;
  } catch {
    return null;
  }
  if (meta.version !== 1 || !Number.isInteger(meta.chunks) || meta.chunks < 1) {
    return null;
  }

  const chunks = await Promise.all(
    Array.from({ length: meta.chunks }, (_, index) =>
      SecureStore.getItemAsync(`${CACHE_CHUNK_PREFIX}${index}`),
    ),
  );
  if (chunks.some((chunk) => chunk === null)) return null;

  try {
    return JSON.parse(
      joinSecureStoreChunks(chunks as string[]),
    ) as CampusSnapshot;
  } catch {
    return null;
  }
}

export async function writeCampusCache(
  snapshot: CampusSnapshot,
): Promise<void> {
  const previousRawMeta = await SecureStore.getItemAsync(CACHE_META_KEY);
  let previousChunks = 0;
  if (previousRawMeta) {
    try {
      const previous = JSON.parse(previousRawMeta) as CacheMeta;
      previousChunks = Number.isInteger(previous.chunks) ? previous.chunks : 0;
    } catch {
      previousChunks = 0;
    }
  }

  const chunks = splitForSecureStore(
    JSON.stringify(snapshot),
    CACHE_CHUNK_SIZE,
  );
  await Promise.all(
    chunks.map((chunk, index) =>
      SecureStore.setItemAsync(`${CACHE_CHUNK_PREFIX}${index}`, chunk, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      }),
    ),
  );
  await SecureStore.setItemAsync(
    CACHE_META_KEY,
    JSON.stringify({ version: 1, chunks: chunks.length } satisfies CacheMeta),
    { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
  );

  if (previousChunks > chunks.length) {
    await Promise.all(
      Array.from({ length: previousChunks - chunks.length }, (_, offset) =>
        SecureStore.deleteItemAsync(
          `${CACHE_CHUNK_PREFIX}${chunks.length + offset}`,
        ),
      ),
    );
  }
}

export async function clearCampusCache(): Promise<void> {
  const rawMeta = await SecureStore.getItemAsync(CACHE_META_KEY);
  if (rawMeta) {
    try {
      const meta = JSON.parse(rawMeta) as CacheMeta;
      if (Number.isInteger(meta.chunks) && meta.chunks > 0) {
        await deleteChunks(meta.chunks);
      }
    } catch {
      // Delete metadata even when an interrupted write left it unreadable.
    }
  }
  await SecureStore.deleteItemAsync(CACHE_META_KEY);
}
