import { metaLine } from '@/components/video-row/helpers';
import { VideoError, type PlaybackErrorCode } from '@/services/youtube';

/** The `t=` route param as seconds, or undefined when it is missing or not a valid position. */
export function parseStartAt(t: string | undefined): number | undefined {
  const seconds = t ? Number(t) : NaN;
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
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

/** The info block's second line: `channel · views · age`, skipping unknown parts. */
export function infoLine(video: { channel: string; viewsLabel?: string; publishedLabel?: string }): string {
  return [video.channel, metaLine(video)].filter(Boolean).join(' · ');
}

/** The HTTP 403 YouTube answers an expired or rejected Stream with, as a player message or a playlist request error. */
const FORBIDDEN = /\b403\b|forbidden/i;

/**
 * Whether a playback failure means YouTube rejected the Stream: a player error message mentioning
 * a 403 (Android "Response code: 403", iOS "HTTP 403: Forbidden") or an error carrying `status: 403`
 * (the iOS master playlist request). A `VideoError` never is: it already says what went wrong.
 */
export function isStreamRejected(error: unknown): boolean {
  if (error instanceof VideoError) return false;
  if (typeof error === 'string') return FORBIDDEN.test(error);
  if (typeof error !== 'object' || error === null) return false;
  if ('status' in error && error.status === 403) return true;
  return 'message' in error && typeof error.message === 'string' && FORBIDDEN.test(error.message);
}

/** Any playback failure (player message, thrown error) as the `VideoError` to show; `code` names where it happened. */
export function playbackError(error: unknown, code: PlaybackErrorCode): VideoError {
  if (error instanceof VideoError) return error;
  const detail = typeof error === 'string' ? error : error instanceof Error ? error.message : undefined;
  return new VideoError('failed', { code: isStreamRejected(error) ? 'http-403' : code, detail, cause: error });
}

/**
 * A re-resolve playback has not yet moved past: the position it restored. Until playback really
 * progresses beyond it, another rejection counts as the second failure in a row. null when none.
 */
export type Recovery = { restoredAt: number } | null;

/** Seconds of playback past the restore point that prove a re-resolved Stream works. */
const PROGRESS_SECONDS = 2;

/** The pending re-resolve after a `timeUpdate` at `currentTime`: cleared once playback moved past it. */
export function recoveryAfter(recovery: Recovery, currentTime: number): Recovery {
  return recovery && currentTime >= recovery.restoredAt + PROGRESS_SECONDS ? null : recovery;
}

/**
 * What to do about a playback failure. A Stream YouTube rejects (usually an expired link) is
 * re-resolved once; a rejection before playback moved past that re-resolve, or any other failure, is shown.
 */
export function streamFailureOutcome(
  error: unknown,
  recovery: Recovery,
  code: PlaybackErrorCode,
): { reResolve: true } | { error: VideoError } {
  if (isStreamRejected(error) && !recovery) return { reResolve: true };
  return { error: playbackError(error, code) };
}

/** The Video's page on youtube.com, for "Open in YouTube". */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}
