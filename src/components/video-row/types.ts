/** Plain props so search results, History and Related Videos can all feed it without service types. */
export type VideoRowProps = {
  thumbnailUrl: string;
  title: string;
  channel: string;
  /** Badge on the thumbnail; hidden when 0 (unknown / live). */
  durationSeconds: number;
  /** Optional "views · age" line, already formatted, e.g. `1.2M views · 3 years ago`. */
  meta?: string;
  /** Watched fraction, 0–1; the bar is hidden when absent or 0. */
  progress?: number;
  onPress: () => void;
  onLongPress?: () => void;
};
