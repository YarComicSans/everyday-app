import { readFileSync } from 'fs';
import { join } from 'path';

import { rewritePlaylist } from '../playlist';

/** A VISIONOS master playlist recorded once from YouTube (17 variants, 144p–2160p, 2 audio groups). */
const master = readFileSync(join(__dirname, '../__fixtures__/visionos-master.m3u8'), 'utf8');
const BASE = 'https://manifest.googlevideo.com/api/manifest/hls_variant/id/abc/file/index.m3u8';

/** Each `#EXT-X-STREAM-INF` with the URI line that follows it. */
function variants(playlist: string) {
  const lines = playlist.split('\n');
  return lines.flatMap((line, i) => {
    if (!line.startsWith('#EXT-X-STREAM-INF:')) return [];
    const [w, h] = /RESOLUTION=(\d+)x(\d+)/.exec(line)!.slice(1).map(Number);
    return [{ width: w, height: h, uri: lines[i + 1] }];
  });
}

const audioGroups = (playlist: string) =>
  playlist.split('\n').filter((l) => l.startsWith('#EXT-X-MEDIA:') && l.includes('TYPE=AUDIO'));

describe('rewritePlaylist against the recorded VISIONOS master playlist', () => {
  it('the fixture has variants above 1080p to remove', () => {
    expect(variants(master)).toHaveLength(17);
  });

  it('keeps only the 480p-and-below variants for Data Saver', () => {
    const out = variants(rewritePlaylist(master, { width: 854, height: 480 }, BASE));
    expect(out).toHaveLength(11);
    expect(out.every((v) => v.width <= 854 && v.height <= 480)).toBe(true);
    expect(out.filter((v) => v.height === 480)).toHaveLength(2);
  });

  it('keeps only the 1080p-and-below variants for a 1080p cap', () => {
    const out = variants(rewritePlaylist(master, { width: 1920, height: 1080 }, BASE));
    expect(out).toHaveLength(15);
    expect(out.every((v) => v.width <= 1920 && v.height <= 1080)).toBe(true);
    expect(out.filter((v) => v.height === 1080)).toHaveLength(2);
  });

  it('keeps the audio groups and the header', () => {
    const out = rewritePlaylist(master, { width: 854, height: 480 }, BASE);
    expect(audioGroups(out)).toEqual(audioGroups(master));
    expect(out.startsWith('#EXTM3U\n#EXT-X-INDEPENDENT-SEGMENTS\n')).toBe(true);
  });

  it('keeps every variant paired with its own absolute URI', () => {
    const out = variants(rewritePlaylist(master, { width: 854, height: 480 }, BASE));
    for (const v of out) expect(v.uri).toMatch(/^https:\/\/manifest\.googlevideo\.com\/.+\/index\.m3u8$/);
    expect(out.find((v) => v.width === 854 && v.uri.includes('/itag/231/'))).toBeDefined();
  });
});

describe('rewritePlaylist with relative URIs', () => {
  const relative = [
    '#EXTM3U',
    '#EXT-X-MEDIA:URI="audio/en.m3u8",TYPE=AUDIO,GROUP-ID="a",NAME="Default",DEFAULT=YES',
    '#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=854x480,AUDIO="a"',
    'v480/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=2,RESOLUTION=1280x720,AUDIO="a"',
    'v720/index.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=3,RESOLUTION=640x360,AUDIO="a"',
    '/root/v360.m3u8',
    '',
  ].join('\n');
  const base = 'https://cdn.example.com/hls/video/master.m3u8?sig=1';

  it('resolves variant and media URIs against the master playlist URL', () => {
    expect(rewritePlaylist(relative, { width: 854, height: 480 }, base)).toBe(
      [
        '#EXTM3U',
        '#EXT-X-MEDIA:URI="https://cdn.example.com/hls/video/audio/en.m3u8",TYPE=AUDIO,GROUP-ID="a",NAME="Default",DEFAULT=YES',
        '#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=854x480,AUDIO="a"',
        'https://cdn.example.com/hls/video/v480/index.m3u8',
        '#EXT-X-STREAM-INF:BANDWIDTH=3,RESOLUTION=640x360,AUDIO="a"',
        'https://cdn.example.com/root/v360.m3u8',
        '',
      ].join('\n'),
    );
  });
});

describe('rewritePlaylist with a portrait Video', () => {
  const portrait = [
    '#EXTM3U',
    '#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=270x480',
    'https://cdn.example.com/480.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=2,RESOLUTION=480x854',
    'https://cdn.example.com/854.m3u8',
    '#EXT-X-STREAM-INF:BANDWIDTH=3,RESOLUTION=1080x1920',
    'https://cdn.example.com/1920.m3u8',
  ].join('\n');

  it('treats a 480x854 portrait variant as 480p', () => {
    const out = variants(rewritePlaylist(portrait, { width: 854, height: 480 }, BASE));
    expect(out.map((v) => v.uri)).toEqual([
      'https://cdn.example.com/480.m3u8',
      'https://cdn.example.com/854.m3u8',
    ]);
  });
});
