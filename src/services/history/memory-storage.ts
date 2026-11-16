import type { HistoryEntry, HistoryStorage } from './types';

/** Non-persistent `HistoryStorage`, for tests. */
export function memoryStorage(): HistoryStorage {
  const entries = new Map<string, HistoryEntry>();
  return {
    get: (videoId) => entries.get(videoId) ?? null,
    put: (entry) => void entries.set(entry.videoId, entry),
    all: () => [...entries.values()],
    remove: (videoId) => void entries.delete(videoId),
    clear: () => entries.clear(),
  };
}
