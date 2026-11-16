import { YTNodes, type YT } from 'youtubei.js';

import { playabilityError, toVideoError, VideoError } from './errors';
import { getSession, resetSession, STREAM_CLIENTS } from './session';
import { fromVideoInfo, fromVideoNode, relatedVideos } from './summaries';
import type { LoadedVideo, Stream, VideoSummary } from './types';

type StreamClient = (typeof STREAM_CLIENTS)[number];

/** Searches YouTube; returns Videos only (no channels, playlists or Shorts shelves). */
export function search(query: string): Promise<VideoSummary[]> {
  return guarded(async () => {
    const yt = await getSession();
    const results = await yt.search(query, { type: 'video' });
    return results.results.filterType(YTNodes.Video).map(fromVideoNode);
  });
}

/** A Video's details, its Related Videos and a playable Stream, for the Watch page. */
export function loadVideo(videoId: string): Promise<LoadedVideo> {
  return guarded(async () => {
    const yt = await getSession();
    const { info, stream } = await playable((client) => yt.getInfo(videoId, { client }));
    return { video: fromVideoInfo(info), related: relatedVideos(info, videoId), stream };
  });
}

/** A fresh Stream for a Video, e.g. after the previous one went stale or was rejected. */
export function resolveStream(videoId: string): Promise<Stream> {
  return guarded(async () => {
    const yt = await getSession();
    const { stream } = await playable((client) => yt.getBasicInfo(videoId, { client }));
    return stream;
  });
}

/** Asks each client in order until one returns a playable HLS Stream. */
async function playable(
  fetchInfo: (client: StreamClient) => Promise<YT.VideoInfo>,
): Promise<{ info: YT.VideoInfo; stream: Stream }> {
  let lastError: VideoError | undefined;
  for (const client of STREAM_CLIENTS) {
    try {
      const info = await fetchInfo(client);
      const { status = '', reason = '' } = info.playability_status ?? {};
      const blocked = playabilityError(status, reason);
      if (blocked) throw blocked;
      const url = info.streaming_data?.hls_manifest_url;
      if (!url) throw new VideoError('failed', { code: 'no-hls', detail: client });
      return { info, stream: { url, resolvedAt: Date.now() } };
    } catch (e) {
      lastError = toVideoError(e);
      // Another client won't help when the network itself is the problem.
      if (lastError.kind === 'limited' || lastError.kind === 'offline') break;
    }
  }
  throw lastError ?? new VideoError('failed', { code: 'no-client' });
}

async function guarded<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (e) {
    const error = toVideoError(e);
    // A bot wall is tied to the session's visitor data; start over next time.
    if (error.kind === 'limited') resetSession();
    throw error;
  }
}
