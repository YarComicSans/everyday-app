export type VideoErrorKind = 'limited' | 'unplayable' | 'unavailable' | 'offline' | 'failed';

/** Where a failure outside this service happened, for errors the Watch page raises during playback. */
export type PlaybackErrorCode = 'load' | 'source' | 'player' | 'quality' | 'resume' | 'reresolve' | 'foreground';

/** The short identifier shown and reported with a `failed` error. */
export type VideoErrorCode =
  /** An HTTP failure, e.g. `http-500`. */
  | `http-${number}`
  /** A playability status this service does not map, lower-cased, e.g. `status-live_stream_offline`. */
  | `status-${Lowercase<string>}`
  | 'playability'
  | 'parse'
  | 'runtime'
  | 'no-hls'
  | 'no-client'
  | 'unknown'
  | PlaybackErrorCode;

/**
 * The only error the `youtube` service throws. Screens switch on `kind`:
 * - `limited`: bot wall or rate limit ("YouTube is limiting this network")
 * - `unplayable`: made-for-kids, age-restricted, region-locked
 * - `unavailable`: removed or private
 * - `offline`: no connection
 * - `failed`: anything else; `code` is a short identifier to show and report
 */
export class VideoError extends Error {
  kind: VideoErrorKind;
  code?: VideoErrorCode;

  constructor(kind: VideoErrorKind, opts: { code?: VideoErrorCode; detail?: string; cause?: unknown } = {}) {
    super(opts.detail ? `${kind}: ${opts.detail}` : kind, { cause: opts.cause });
    this.name = 'VideoError';
    this.kind = kind;
    if (opts.code) this.code = opts.code;
  }
}

/** Maps a player response's playability status; null when the Video is playable. */
export function playabilityError(status: string, reason = ''): VideoError | null {
  const detail = reason ? `${status}: ${reason}` : status;
  switch (status) {
    case 'OK':
      return null;
    case 'LOGIN_REQUIRED':
      // The same status covers the bot wall, private Videos and age checks.
      if (/\bbot\b/i.test(reason)) return new VideoError('limited', { detail });
      if (/private/i.test(reason)) return new VideoError('unavailable', { detail });
      return new VideoError('unplayable', { detail });
    case 'UNPLAYABLE':
    case 'AGE_CHECK_REQUIRED':
    case 'AGE_VERIFICATION_REQUIRED':
    case 'CONTENT_CHECK_REQUIRED':
      return new VideoError('unplayable', { detail });
    case 'ERROR':
      return new VideoError('unavailable', { detail });
    default:
      return new VideoError('failed', {
        code: status ? `status-${status.toLowerCase() as Lowercase<string>}` : 'playability',
        detail,
      });
  }
}

/** Turns anything thrown while talking to YouTube into a VideoError. */
export function toVideoError(error: unknown): VideoError {
  if (error instanceof VideoError) return error;
  if (!(error instanceof Error)) return new VideoError('failed', { code: 'unknown', cause: error });

  if (error instanceof TypeError && /network|fetch failed|internet|offline/i.test(error.message)) {
    return new VideoError('offline', { detail: error.message, cause: error });
  }

  // YouTube.js reports HTTP failures as "Request to <url> failed with status code <n>".
  const http = /status code (\d{3})/.exec(error.message);
  if (http) {
    const status = Number(http[1]);
    if (status === 429) return new VideoError('limited', { detail: error.message, cause: error });
    return new VideoError('failed', { code: `http-${status}`, detail: error.message, cause: error });
  }

  // YouTube.js throws on some playability statuses (e.g. ERROR) with the status as `info`.
  const info = (error as { info?: unknown }).info;
  if (info && typeof info === 'object' && 'status' in info && typeof info.status === 'string') {
    const reason = 'reason' in info && typeof info.reason === 'string' ? info.reason : '';
    const mapped = playabilityError(info.status, reason);
    if (mapped) {
      mapped.cause = error;
      return mapped;
    }
  }

  const code = error.name === 'ParsingError' ? 'parse' : 'unknown';
  return new VideoError('failed', { code, detail: error.message, cause: error });
}
