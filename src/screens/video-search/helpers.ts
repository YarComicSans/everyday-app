import type { HistoryEntry } from '@/services/history';
import { parseVideoLink, VideoError, type VideoSummary } from '@/services/youtube';

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
export function progressOf(entry: HistoryEntry | undefined): number | undefined {
  if (!entry || !(entry.durationSeconds > 0)) return undefined;
  if (entry.watched) return 1;
  return Math.min(1, entry.resumePosition / entry.durationSeconds);
}

/** The "views · age" line under a result; absent when neither is known. */
export function metaOf(video: Pick<VideoSummary, 'viewsLabel' | 'publishedLabel'>): string | undefined {
  return [video.viewsLabel, video.publishedLabel].filter(Boolean).join(' · ') || undefined;
}

/** What a failed search shows above Retry. `offline` disables the search box until a retry succeeds. */
export type SearchFailure = { message: string; hint?: string; offline: boolean };

export function searchFailure(error: unknown): SearchFailure {
  const kind = error instanceof VideoError ? error.kind : 'failed';
  switch (kind) {
    case 'limited':
      return {
        message: 'YouTube is limiting this network',
        hint: 'Try switching between Wi-Fi and mobile data.',
        offline: false,
      };
    case 'offline':
      return { message: "You're offline", offline: true };
    default:
      return { message: 'Search failed', offline: false };
  }
}
