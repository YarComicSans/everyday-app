export type QualityMode = 'auto' | 'data-saver' | 'best';

/** A size in physical pixels. */
export type Resolution = { width: number; height: number };

/** The screen as `Dimensions.get('screen')` reports it: points plus pixel ratio. */
export type ScreenSize = { width: number; height: number; scale: number };

/** An HLS master playlist URL and when it was resolved (epoch ms); same shape as the `youtube` Stream. */
export type StreamLike = { url: string; resolvedAt: number };
