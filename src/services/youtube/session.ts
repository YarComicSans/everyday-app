import { Innertube, Log, type Types } from 'youtubei.js';

import { VideoError } from './errors';

/**
 * Clients asked for a Stream, in order. VISIONOS returns an HLS master
 * playlist without needing a proof-of-origin token or deciphering. Kept as a
 * list so a fallback client can be added without reshaping the code.
 */
export const STREAM_CLIENTS = ['VISIONOS'] as const;

/**
 * In-memory cache for YouTube.js. The built-in React Native cache expects an
 * old react-native-mmkv API, so we pass our own. Nothing is persisted, which
 * also keeps visitor data from outliving the app process.
 */
class MemoryCache implements Types.ICache {
  #store = new Map<string, ArrayBuffer>();
  cache_dir = '';
  async get(key: string) {
    return this.#store.get(key);
  }
  async set(key: string, value: ArrayBuffer) {
    this.#store.set(key, value);
  }
  async remove(key: string) {
    this.#store.delete(key);
  }
}

let session: Promise<Innertube> | null = null;

/** The app-lifetime YouTube.js session, created on first use. */
export function getSession(): Promise<Innertube> {
  if (!session) {
    session = createSession();
    session.catch(() => {
      session = null;
    });
  }
  return session;
}

/** Drops the session so the next call starts over with fresh visitor data (after a bot wall). */
export function resetSession() {
  session = null;
}

async function createSession(): Promise<Innertube> {
  assertRuntime();
  // YouTube.js warns about every unknown node it meets; YouTube adds new ones constantly.
  Log.setLevel(Log.Level.ERROR);
  return Innertube.create({
    retrieve_player: false, // VISIONOS needs no deciphering, and loading the player is slow.
    enable_session_cache: false, // fresh visitor data for every session
    cache: new MemoryCache(),
    // Looked up per request rather than captured at import time.
    fetch: (input, init) => globalThis.fetch(input, init),
  });
}

function assertRuntime() {
  const missing = (['TextDecoder', 'atob', 'btoa'] as const).filter(
    (name) => typeof globalThis[name] !== 'function',
  );
  if (missing.length > 0) {
    throw new VideoError('failed', { code: 'runtime', detail: `missing ${missing.join(', ')}` });
  }
}
