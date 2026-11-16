import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { rewritePlaylist } from './playlist';
import { maxResolutionFor } from './quality';
import type { QualityMode, ScreenSize, StreamLike } from './types';

/**
 * A source the player can load that respects the Quality Mode's cap.
 *
 * Android: the Stream's own master playlist; the caller applies `maxResolutionFor` as the player's
 * `maxResolution`, a hard cap that switches mid-playback.
 * iOS: `maxResolution` is only a hint, so when a cap applies the master playlist is fetched,
 * rewritten without the variants above the cap, and played from a local file. A failed playlist
 * request throws a `PlaylistRequestError` carrying the HTTP status (403 when YouTube rejects the Stream).
 */
export async function prepareSource(
  stream: StreamLike,
  mode: QualityMode,
  screen: ScreenSize,
): Promise<{ uri: string }> {
  const cap = maxResolutionFor(mode, screen);
  if (Platform.OS !== 'ios' || !cap) return { uri: stream.url };

  const response = await fetch(stream.url);
  if (!response.ok) throw new PlaylistRequestError(response.status);
  const playlist = rewritePlaylist(await response.text(), cap, stream.url);

  // One file per Stream and mode: a re-resolved Stream gets a new URI, so the player reloads it.
  const file = new File(Paths.cache, 'playback', `master-${stream.resolvedAt}-${mode}.m3u8`);
  file.create({ intermediates: true, overwrite: true });
  await file.write(playlist);
  return { uri: file.uri };
}

/** The master playlist request failed; `status` is its HTTP status. */
export class PlaylistRequestError extends Error {
  status: number;

  constructor(status: number) {
    super(`Master playlist request failed: HTTP ${status}`);
    this.name = 'PlaylistRequestError';
    this.status = status;
  }
}
