import { loadVideo, resolveStream, search } from '..';
import { installFakeYouTube } from '../__fixtures__/replay';

const youtube = installFakeYouTube();

afterAll(() => youtube.restore());

const NOW = Date.UTC(2026, 10, 16, 18, 40);
const HLS = /^https:\/\/manifest\.googlevideo\.com\/api\/manifest\/hls_variant\//;

beforeEach(() => jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] }));
afterEach(() => jest.useRealTimers());

describe('search', () => {
  it('returns only the Videos from the recorded results page', async () => {
    const results = await search('lofi hip hop');

    // The recorded page has 20 video rows plus 7 non-video card lists.
    expect(results).toHaveLength(20);
    for (const video of results) {
      expect(video.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(video.title).not.toBe('');
      expect(video.channel).not.toBe('');
      expect(video.thumbnailUrl).toMatch(/^https:\/\/i\.ytimg\.com\//);
    }
  });

  it('maps a regular Video row', async () => {
    const results = await search('lofi hip hop');

    expect(results[1]).toEqual({
      id: 'n61ULEU7CO0',
      title: 'Best of lofi hip hop 2021 ✨ [beats to relax/study to]',
      channel: 'Lofi Girl',
      durationSeconds: 22258,
      thumbnailUrl: expect.stringMatching(/^https:\/\/i\.ytimg\.com\/vi\/n61ULEU7CO0\/hq720\.jpg/),
      viewsLabel: '58M views',
      publishedLabel: '4y ago',
    });
  });

  it('maps a live Video with unknown duration', async () => {
    const results = await search('lofi hip hop');

    expect(results[0]).toEqual({
      id: 'rFZHOHl-L8A',
      title: 'lofi hip hop radio 📚 beats to relax/study to',
      channel: 'Lofi Girl',
      durationSeconds: 0,
      thumbnailUrl: expect.stringMatching(/^https:\/\/i\.ytimg\.com\/vi\/rFZHOHl-L8A\//),
      viewsLabel: '20K watching',
    });
  });
});

describe('loadVideo', () => {
  it('returns the Video details', async () => {
    const { video } = await loadVideo('dQw4w9WgXcQ');

    expect(video).toEqual({
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)',
      channel: 'Rick Astley',
      durationSeconds: 213,
      thumbnailUrl: expect.stringMatching(/^https:\/\/i\.ytimg\.com\/vi\/dQw4w9WgXcQ\//),
      viewsLabel: '1.8B views',
      publishedLabel: '17y ago',
    });
  });

  it('returns the HLS Stream, stamped with when it was resolved', async () => {
    const { stream } = await loadVideo('dQw4w9WgXcQ');

    expect(stream).toEqual({ url: expect.stringMatching(HLS), resolvedAt: NOW });
  });

  it('returns the Related Videos', async () => {
    const { related } = await loadVideo('dQw4w9WgXcQ');

    expect(related.length).toBeGreaterThan(5);
    expect(related[0]).toEqual({
      id: 'yPYZpwSpKmA',
      title: 'Rick Astley - Together Forever (Official Video) [4K Remaster]',
      channel: 'Rick Astley',
      durationSeconds: 204,
      thumbnailUrl: expect.stringMatching(/^https:\/\/i\.ytimg\.com\/vi\/yPYZpwSpKmA\//),
      viewsLabel: '208M views',
      publishedLabel: '17y ago',
    });
    for (const video of related) {
      expect(video.id).toMatch(/^[A-Za-z0-9_-]{11}$/);
      expect(video.id).not.toBe('dQw4w9WgXcQ');
      expect(video.title).not.toBe('');
    }
  });
});

describe('resolveStream', () => {
  it('resolves a fresh HLS Stream on every call', async () => {
    const first = await resolveStream('dQw4w9WgXcQ');
    jest.setSystemTime(NOW + 60_000);
    const second = await resolveStream('dQw4w9WgXcQ');

    expect(first).toEqual({ url: expect.stringMatching(HLS), resolvedAt: NOW });
    expect(second).toEqual({ url: expect.stringMatching(HLS), resolvedAt: NOW + 60_000 });
  });
});
