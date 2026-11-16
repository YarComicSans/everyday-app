#!/usr/bin/env node
/**
 * Records the YouTube responses the `youtube` service tests replay.
 *
 *   node ./scripts/record-youtube-fixtures.mjs
 *
 * Unlike the gspns fixtures these are committed: they are recorded once and
 * must not change between test runs. Re-record only when a YouTube.js upgrade
 * or a YouTube change makes the tests stale, then review the diff (the tests
 * pin a few titles and IDs from the recording and will need updating).
 *
 * Every request YouTube.js makes is saved under
 * src/services/youtube/__fixtures__/ as <endpoint>[.<videoId>].<ext>:
 *   sw.js_data.txt, config.json  session bootstrap
 *   search.json                 search for SEARCH_QUERY
 *   player.<id>.json            /player as the VISIONOS client
 *   next.<id>.json              /next (details + Related Videos)
 *
 * YouTube echoes the caller's public IP (in stream URLs and session data); it
 * is replaced with a documentation address before anything is written.
 *
 * The bot wall can't be triggered on demand, so player.<BOT_WALL_ID>.json is
 * synthesized from the removed-video response with the playability status
 * YouTube sends when it blocks a network ("Sign in to confirm you're not a
 * bot"); next.<BOT_WALL_ID>.json is a copy of the removed one.
 * A private Video needs one we know stays private, so player.<PRIVATE_ID>.json is
 * synthesized the same way with the status YouTube sends for one ("Private video").
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Innertube, Log } from 'youtubei.js';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../src/services/youtube/__fixtures__');

const SEARCH_QUERY = 'lofi hip hop';
const VIDEOS = {
  normal: 'dQw4w9WgXcQ',
  madeForKids: 'XqZsoesa55w',
  removed: 'aaaaaaaaaaa',
};
const BOT_WALL_ID = 'botwallbot0';
const PRIVATE_ID = 'privatevid0';
const PLACEHOLDER_IP = '203.0.113.7';

Log.setLevel(Log.Level.ERROR);

/** fixture name → response body */
const recorded = new Map();

async function recordingFetch(input, init) {
  const request = new Request(input, init);
  const body = request.body ? await request.clone().text() : '';
  const response = await fetch(request);
  recorded.set(fixtureName(request.url, body), await response.clone().text());
  return response;
}

function fixtureName(url, body) {
  const { pathname } = new URL(url);
  if (pathname === '/sw.js_data') return 'sw.js_data.txt';
  const endpoint = pathname.split('/').pop();
  if (endpoint === 'player' || endpoint === 'next') {
    return `${endpoint}.${JSON.parse(body).videoId}.json`;
  }
  return `${endpoint}.json`;
}

const yt = await Innertube.create({
  retrieve_player: false,
  enable_session_cache: false,
  fetch: recordingFetch,
});

await yt.search(SEARCH_QUERY, { type: 'video' });
for (const id of Object.values(VIDEOS)) {
  await yt.getInfo(id, { client: 'VISIONOS' }).catch((e) => console.log(`${id}: ${e.message}`));
}

/** Records `id` as the removed Video's responses with another playability status. */
function synthesize(id, playabilityStatus) {
  const player = JSON.parse(recorded.get(`player.${VIDEOS.removed}.json`));
  player.playabilityStatus = playabilityStatus;
  delete player.videoDetails;
  recorded.set(`player.${id}.json`, JSON.stringify(player));
  recorded.set(`next.${id}.json`, recorded.get(`next.${VIDEOS.removed}.json`));
}

synthesize(BOT_WALL_ID, {
  status: 'LOGIN_REQUIRED',
  reason: 'Sign in to confirm you’re not a bot',
  messages: ['This helps protect our community. Learn more'],
});
synthesize(PRIVATE_ID, {
  status: 'LOGIN_REQUIRED',
  reason: 'Private video',
  messages: ['If the owner of this video has granted you access, please sign in.'],
});

const ips = new Set();
for (const text of recorded.values()) {
  for (const [, ip] of text.matchAll(/\bip[=/](\d{1,3}(?:\.\d{1,3}){3})\b/g)) {
    if (ip !== '0.0.0.0') ips.add(ip);
  }
}

mkdirSync(OUT, { recursive: true });
for (const [name, text] of recorded) {
  let scrubbed = text;
  for (const ip of ips) scrubbed = scrubbed.replaceAll(ip, PLACEHOLDER_IP);
  writeFileSync(join(OUT, name), scrubbed);
}

console.log(`Recorded ${recorded.size} YouTube fixtures in ${OUT}`);
