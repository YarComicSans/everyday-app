import type { HistoryEntry } from '@/services/history';
import { failureContent } from '@/components/playback-failure-view/helpers';
import { parseVideoLink, VideoError } from '@/services/youtube';

/** Route params for the Watch page; `t` (seconds) only when a Video Link carried one. */
export type WatchParams = { id: string; t?: string };

export type SubmitTarget = { type: 'watch'; params: WatchParams } | { type: 'search'; query: string };

/** What submitting the search box does: open a pasted Video Link, search for anything else, or nothing when blank. */
export function submitTarget(text: string): SubmitTarget | null {
  const query = text.trim();
  if (!query) return null;
  const link = parseVideoLink(query);
  if (!link) return { type: 'search', query };
  return {
    type: 'watch',
    params: link.startAt ? { id: link.videoId, t: String(link.startAt) } : { id: link.videoId },
  };
}

/** How far into a Video its History Entry got (0–1), for `VideoRow`'s bar; absent without an entry or a known duration. */
export function watchedFraction(entry: HistoryEntry | undefined): number | undefined {
  if (!entry || !(entry.durationSeconds > 0)) return undefined;
  if (entry.watched) return 1;
  return Math.min(1, entry.resumePosition / entry.durationSeconds);
}

/** What a failed search shows above Retry. `offline` disables the search box (see `searchAvailability`). */
export type SearchFailure = { message: string; hint?: string; offline: boolean };

export function searchFailure(error: unknown): SearchFailure {
  const kind = error instanceof VideoError ? error.kind : 'failed';
  switch (kind) {
    case 'limited':
    case 'offline': {
      // The same copy as the Watch page's failure view.
      const { message, hint } = failureContent(kind);
      const offline = kind === 'offline';
      return hint ? { message, hint, offline } : { message, offline };
    }
    default:
      return { message: 'Search failed', offline: false };
  }
}

/**
 * Whether Search is offline, and the failure to show, from the network's internet reachability
 * (`undefined` while unknown) and the last search's failure. A known reachability wins, so Search
 * disables itself as soon as the internet is gone and re-enables once it is back.
 */
export function searchAvailability(
  reachable: boolean | undefined,
  failure: SearchFailure | null,
): { offline: boolean; failure: SearchFailure | null } {
  if (reachable === false) return { offline: true, failure: searchFailure(new VideoError('offline')) };
  if (reachable === true && failure?.offline) return { offline: false, failure: null };
  return { offline: failure?.offline ?? false, failure };
}
