import type { HistoryEntry, HistoryVideo } from './types';

/**
 * The entry after playback of `video` starts at `now`: metadata refreshed, moved to the top,
 * Resume Position and Watched kept. A Video new to History starts at 0.
 */
export function started(existing: HistoryEntry | null, video: HistoryVideo, now: number): HistoryEntry {
  return {
    videoId: video.id,
    title: video.title,
    channel: video.channel,
    durationSeconds: video.durationSeconds > 0 ? video.durationSeconds : (existing?.durationSeconds ?? 0),
    thumbnailUrl: video.thumbnailUrl,
    lastWatchedAt: now,
    resumePosition: existing?.resumePosition ?? 0,
    watched: existing?.watched ?? false,
  };
}

/** A Resume Position below this restarts the Video from the beginning. */
export const MIN_RESUME_SECONDS = 10;

/** A Resume Position at or past this fraction of the Video's length makes it Watched. */
export const WATCHED_FRACTION = 0.95;

/** Where playback should start for this entry: 0 when there is none, it is Watched, or it is under 10 s. */
export function resumePositionOf(entry: HistoryEntry | null): number {
  if (!entry || entry.watched || entry.resumePosition < MIN_RESUME_SECONDS) return 0;
  return entry.resumePosition;
}

/** True when `seconds` is in the last 5% of a Video of known length. */
export function isWatchedAt(seconds: number, durationSeconds: number): boolean {
  return durationSeconds > 0 && seconds >= durationSeconds * WATCHED_FRACTION;
}

/** Saves a Resume Position; Watched follows the position, so a later save below the last 5% clears it. */
export function withPosition(entry: HistoryEntry, seconds: number, durationSeconds: number): HistoryEntry {
  const duration = durationSeconds > 0 ? durationSeconds : entry.durationSeconds;
  return {
    ...entry,
    durationSeconds: duration,
    resumePosition: seconds,
    watched: isWatchedAt(seconds, duration),
  };
}

/** History order: most recent first. */
export function mostRecentFirst(entries: readonly HistoryEntry[]): HistoryEntry[] {
  return [...entries].sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
}
