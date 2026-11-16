export type VideoSummary = {
  id: string;
  title: string;
  channel: string;
  /** 0 if unknown (e.g. live). */
  durationSeconds: number;
  thumbnailUrl: string;
  /** e.g. "1.2M views" */
  viewsLabel?: string;
  /** e.g. "3 years ago" */
  publishedLabel?: string;
};

/** A playable HLS master playlist. `resolvedAt` is epoch ms. */
export type Stream = { url: string; resolvedAt: number };

export type LoadedVideo = { video: VideoSummary; related: VideoSummary[]; stream: Stream };
