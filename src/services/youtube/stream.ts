import type { Stream } from './types';

/*
 * Why 5 hours: YouTube Stream links expire about 6 h after they are resolved
 * (the player response reports `expiresInSeconds` ≈ 21540, i.e. 5 h 59 min).
 * The expiry is not visible in the URL we hand to the player, so we judge by
 * the age of the Stream instead and re-resolve once it is older than 5 h,
 * which leaves an hour of margin for a long Video that is already playing.
 */
const MAX_STREAM_AGE_MS = 5 * 60 * 60 * 1000;

/** True when the Stream is old enough that it should be resolved again. */
export function isStreamStale(stream: Stream, now: number): boolean {
  return now - stream.resolvedAt > MAX_STREAM_AGE_MS;
}
