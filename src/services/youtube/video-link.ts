export type VideoLink = { videoId: string; startAt?: number };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

// scheme? + host + path + query?; no spaces anywhere, so free text never matches.
const LINK = /^(?:https?:\/\/)?((?:www\.|m\.)?youtube\.com|youtu\.be)(\/[^?#\s]*)?(?:\?([^#\s]*))?(?:#\S*)?$/i;

/**
 * Reads a pasted Video Link. Accepts youtube.com/watch, m.youtube.com/watch,
 * youtu.be/<id> and youtube.com/shorts/<id>, with or without scheme or `www.`.
 * Returns null for anything else, so the text can be used as a search query.
 */
export function parseVideoLink(text: string): VideoLink | null {
  const match = LINK.exec(text.trim());
  if (!match) return null;
  const host = match[1].toLowerCase();
  const path = match[2] ?? '';
  const query = parseQuery(match[3] ?? '');

  let videoId: string | undefined;
  if (host === 'youtu.be') {
    videoId = path.slice(1).replace(/\/$/, '');
  } else if (path === '/watch') {
    videoId = query.get('v');
  } else if (path.startsWith('/shorts/')) {
    videoId = path.slice('/shorts/'.length).replace(/\/$/, '');
  }
  if (!videoId || !VIDEO_ID.test(videoId)) return null;

  const startAt = parseStartTime(query.get('t'));
  return startAt ? { videoId, startAt } : { videoId };
}

function parseQuery(query: string): Map<string, string> {
  const params = new Map<string, string>();
  for (const pair of query.split('&')) {
    const [key, value = ''] = pair.split('=');
    if (key && !params.has(key)) params.set(key, safeDecode(value));
  }
  return params;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** `90`, `90s`, `1h2m3s` or `1m30` (unitless seconds last) → seconds; undefined when absent, zero or malformed. */
function parseStartTime(t: string | undefined): number | undefined {
  if (!t) return undefined;
  if (/^\d+s?$/.test(t)) return Number.parseInt(t, 10) || undefined;
  const parts = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?$/.exec(t);
  if (!parts) return undefined;
  const [, h = '0', m = '0', s = '0'] = parts;
  return Number(h) * 3600 + Number(m) * 60 + Number(s) || undefined;
}
