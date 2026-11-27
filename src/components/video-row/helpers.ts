/** A Video's "views · age" line, skipping unknown parts; undefined when neither is known. */
export function metaLine(video: { viewsLabel?: string; publishedLabel?: string }): string | undefined {
  return [video.viewsLabel, video.publishedLabel].filter(Boolean).join(' · ') || undefined;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Duration badge text: `m:ss` under an hour, `h:mm:ss` otherwise.
 * Returns `null` for 0 or an unknown duration (live streams), so the badge is hidden.
 */
export function formatDuration(seconds: number): string | null {
  const total = Math.floor(seconds);
  if (!(total > 0)) return null;

  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
