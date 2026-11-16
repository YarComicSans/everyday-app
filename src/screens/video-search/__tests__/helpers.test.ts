import type { HistoryEntry } from '@/services/history';

import { VideoError } from '@/services/youtube';

import { metaOf, progressOf, searchFailure, submitTarget } from '../helpers';

describe('submitTarget', () => {
  it('opens the Watch page for a Video Link', () => {
    expect(submitTarget('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      type: 'watch',
      params: { id: 'dQw4w9WgXcQ' },
    });
  });

  it("passes a Video Link's t= through as seconds", () => {
    expect(submitTarget('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=2m13s')).toEqual({
      type: 'watch',
      params: { id: 'dQw4w9WgXcQ', t: '133' },
    });
  });

  it('opens a Shorts link as a normal Video', () => {
    expect(submitTarget('youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
      type: 'watch',
      params: { id: 'dQw4w9WgXcQ' },
    });
  });

  it('searches for anything that is not a Video Link, trimmed', () => {
    expect(submitTarget('  lofi beats  ')).toEqual({ type: 'search', query: 'lofi beats' });
    expect(submitTarget('youtube.com/watch?v=short')).toEqual({
      type: 'search',
      query: 'youtube.com/watch?v=short',
    });
  });

  it('does nothing for blank text', () => {
    expect(submitTarget('   ')).toBeNull();
  });
});

const entry = (over: Partial<HistoryEntry> = {}): HistoryEntry => ({
  videoId: 'dQw4w9WgXcQ',
  title: 'A Video',
  channel: 'A channel',
  durationSeconds: 200,
  thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  lastWatchedAt: 1,
  resumePosition: 50,
  watched: false,
  ...over,
});

describe('progressOf', () => {
  it('is the Resume Position as a fraction of the duration', () => {
    expect(progressOf(entry({ resumePosition: 50, durationSeconds: 200 }))).toBe(0.25);
  });

  it('is full for a Watched Video', () => {
    expect(progressOf(entry({ resumePosition: 196, watched: true }))).toBe(1);
  });

  it('is absent when there is no entry or the duration is unknown', () => {
    expect(progressOf(undefined)).toBeUndefined();
    expect(progressOf(entry({ durationSeconds: 0 }))).toBeUndefined();
  });
});

describe('metaOf', () => {
  it('joins views and age', () => {
    expect(metaOf({ viewsLabel: '1.2M views', publishedLabel: '3 years ago' })).toBe('1.2M views · 3 years ago');
  });

  it('shows whichever part is known, or nothing', () => {
    expect(metaOf({ viewsLabel: '12 views' })).toBe('12 views');
    expect(metaOf({ publishedLabel: '1 day ago' })).toBe('1 day ago');
    expect(metaOf({})).toBeUndefined();
  });
});

describe('searchFailure', () => {
  it('names a bot wall or rate limit and hints at switching networks', () => {
    const failure = searchFailure(new VideoError('limited'));
    expect(failure.message).toBe('YouTube is limiting this network');
    expect(failure.hint).toMatch(/Wi-Fi.*mobile data/);
    expect(failure.offline).toBe(false);
  });

  it('says the device is offline', () => {
    expect(searchFailure(new VideoError('offline'))).toEqual({ message: "You're offline", offline: true });
  });

  it.each([
    new VideoError('failed', { code: 'parse' }),
    new VideoError('unavailable'),
    new Error('boom'),
  ])('reports anything else as a failed search', (error) => {
    expect(searchFailure(error)).toEqual({ message: 'Search failed', offline: false });
  });
});
