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
