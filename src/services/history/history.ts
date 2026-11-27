import { mostRecentFirst, resumePositionOf, started, withPosition } from './rules';
import type { HistoryEntry, HistoryStorage, HistoryVideo } from './types';

export type History = ReturnType<typeof createHistory>;

/** History on top of a `HistoryStorage`. All rules come from `./rules`; storage only keeps rows. */
export function createHistory(storage: HistoryStorage, now: () => number = Date.now) {
  return {
    /** Playback of `video` started: upsert its single entry and move it to the top. */
    recordStart(video: HistoryVideo): void {
      storage.put(started(storage.get(video.id), video, now()));
    },
    /** Saves the Resume Position of a Video already in History. */
    savePosition(videoId: string, seconds: number, durationSeconds: number): void {
      const entry = storage.get(videoId);
      if (entry) storage.put(withPosition(entry, seconds, durationSeconds));
    },
    /** Seconds to start playback at for this Video. */
    resumeAt(videoId: string): number {
      return resumePositionOf(storage.get(videoId));
    },
    list(): HistoryEntry[] {
      return mostRecentFirst(storage.all());
    },
    remove(videoId: string): void {
      storage.remove(videoId);
    },
    clear(): void {
      storage.clear();
    },
  };
}
