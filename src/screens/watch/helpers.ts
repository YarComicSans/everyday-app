import { VideoError } from '@/services/youtube';

/** The `t=` route param as seconds, or undefined when it is missing or not a valid position. */
export function parseStartAt(t: string | undefined): number | undefined {
  const seconds = t ? Number(t) : NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

/** Seconds to start a Video at: `startAt` (a Video Link's `t=`) beats its Resume Position. */
export function startPosition(startAt: number | undefined, resumeAt: () => number): number {
  return startAt ?? resumeAt();
}

/** Playback distance (seconds) between periodic Resume Position saves. */
export const SAVE_EVERY_SECONDS = 10;

/** Whether a `timeUpdate` at `position` should save the Resume Position, given the last saved one. */
export function isSaveDue(lastSaved: number | null, position: number): boolean {
  return lastSaved === null || Math.abs(position - lastSaved) >= SAVE_EVERY_SECONDS;
}

/** Android fires `playToEnd` right away when `play()` hits an empty player; only trust it after real playback. */
export function isRealEnd(currentTime: number, duration: number): boolean {
  return duration > 0 && currentTime > 1;
}

type Labels = { viewsLabel?: string; publishedLabel?: string };

/** The info block's second line: `channel · views · age`, skipping unknown parts. */
export function infoLine(video: Labels & { channel: string }): string {
  return [video.channel, video.viewsLabel, video.publishedLabel].filter(Boolean).join(' · ');
}

/** A Related Video row's `views · age` line, or undefined when neither is known. */
export function relatedMeta(video: Labels): string | undefined {
  return [video.viewsLabel, video.publishedLabel].filter(Boolean).join(' · ') || undefined;
}

/**
 * What to do about a player error. A Stream YouTube rejects with a 403 (usually an expired link)
 * is re-resolved once; a second failure in a row, or any other error, is shown as `failed`.
 */
export function playerErrorOutcome(
  message: string,
  reResolvedInARow: boolean,
): { reResolve: true } | { error: VideoError } {
  const forbidden = /\b403\b/.test(message);
  if (forbidden && !reResolvedInARow) return { reResolve: true };
  return {
    error: new VideoError('failed', {
      code: forbidden ? 'http-403' : 'player',
      detail: message,
    }),
  };
}

/** The Video's page on youtube.com, for "Open in YouTube". */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
