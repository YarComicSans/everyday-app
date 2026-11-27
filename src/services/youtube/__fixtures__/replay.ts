import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Stands in for YouTube at the network boundary: answers every request the
 * `youtube` service makes with the recorded response for that endpoint (and
 * video ID). See scripts/record-youtube-fixtures.mjs.
 */
export type Network =
  | { mode: 'replay' }
  | { mode: 'offline' }
  | { mode: 'status'; endpoint: string; status: number };

export const BOT_WALL_ID = 'botwallbot0';
export const PRIVATE_ID = 'privatevid0';

export function installFakeYouTube() {
  let network: Network = { mode: 'replay' };
  const requests: string[] = [];

  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const body = init?.body ?? (typeof input === 'object' && 'body' in input ? await new Response((input as Request).body).text() : '');
    const name = fixtureName(url, typeof body === 'string' ? body : '');
    requests.push(name);
    if (network.mode === 'offline') throw new TypeError('Network request failed');
    if (network.mode === 'status' && name.startsWith(network.endpoint)) {
      return new Response('{}', { status: network.status });
    }
    return new Response(readFileSync(join(__dirname, name)), {
      status: 200,
      headers: { 'content-type': name.endsWith('.json') ? 'application/json' : 'text/plain' },
    });
  };

  const original = globalThis.fetch;
  globalThis.fetch = fakeFetch as typeof fetch;
  return {
    setNetwork(next: Network) {
      network = next;
    },
    /** Fixture names of the requests made so far, in order. */
    requests,
    restore() {
      globalThis.fetch = original;
    },
  };
}

function fixtureName(url: string, body: string): string {
  const path = url.split('?')[0];
  if (path.endsWith('/sw.js_data')) return 'sw.js_data.txt';
  const endpoint = path.split('/').pop();
  if (endpoint === 'player' || endpoint === 'next') {
    return `${endpoint}.${JSON.parse(body).videoId}.json`;
  }
  return `${endpoint}.json`;
}
