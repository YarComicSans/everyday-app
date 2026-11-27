import type { Resolution } from './types';

const STREAM_INF = '#EXT-X-STREAM-INF:';

/**
 * Rewrites an HLS master playlist so no variant is above `cap`, for iOS, where
 * `maxResolution` is only a hint. Audio / media groups and other tags are kept; relative
 * URIs (variant lines and `URI="…"` attributes) are made absolute against `baseUrl`, the
 * master playlist's own URL, because the result is played from a local file.
 */
export function rewritePlaylist(master: string, cap: Resolution, baseUrl: string): string {
  const lines = master.split(/\r?\n/);
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(STREAM_INF)) {
      const uri = lines[i + 1] ?? '';
      i++;
      if (!fits(line, cap)) continue;
      out.push(line, absolute(uri, baseUrl));
    } else if (line.startsWith('#')) {
      out.push(line.replace(/URI="([^"]*)"/g, (_, uri: string) => `URI="${absolute(uri, baseUrl)}"`));
    } else {
      out.push(line.trim() ? absolute(line, baseUrl) : line);
    }
  }
  return out.join('\n');
}

/**
 * Whether a variant's RESOLUTION fits the cap, comparing long side to long side so a
 * portrait Video (a Short) at 480x854 counts as 480p. Variants without one (audio only) fit.
 */
function fits(streamInf: string, cap: Resolution): boolean {
  const match = /RESOLUTION=(\d+)x(\d+)/.exec(streamInf);
  if (!match) return true;
  const [w, h] = [Number(match[1]), Number(match[2])];
  return (
    Math.max(w, h) <= Math.max(cap.width, cap.height) &&
    Math.min(w, h) <= Math.min(cap.width, cap.height)
  );
}

/** Resolves `uri` against `base`, without relying on React Native's partial `URL`. */
function absolute(uri: string, base: string): string {
  if (/^[a-z][a-z\d+.-]*:/i.test(uri)) return uri;
  const [, scheme, origin] = /^([a-z][a-z\d+.-]*:)(\/\/[^/?#]*)/i.exec(base) ?? [];
  if (uri.startsWith('//')) return scheme + uri;
  if (uri.startsWith('/')) return scheme + origin + uri;
  const dir = base.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  return dir + uri;
}
