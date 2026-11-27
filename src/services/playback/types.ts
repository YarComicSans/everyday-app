export type QualityMode = 'auto' | 'data-saver' | 'best';

/** A size in physical pixels. */
export type Resolution = { width: number; height: number };

/** The screen as `Dimensions.get('screen')` reports it: points plus pixel ratio. */
export type ScreenSize = { width: number; height: number; scale: number };

/**
 * Structurally a `youtube` Stream (HLS master playlist URL, resolved at epoch ms). Declared here
 * rather than imported so this service does not depend on `youtube`.
 */
export type StreamLike = { url: string; resolvedAt: number };
