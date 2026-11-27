import { isStreamStale } from '..';

const HOUR = 60 * 60 * 1000;
const resolvedAt = Date.UTC(2026, 10, 16, 8, 0, 0);
const stream = { url: 'https://example.invalid/master.m3u8', resolvedAt };

describe('isStreamStale', () => {
  it('is fresh right after resolution', () => {
    expect(isStreamStale(stream, resolvedAt)).toBe(false);
  });

  it('is fresh at exactly 5 h', () => {
    expect(isStreamStale(stream, resolvedAt + 5 * HOUR)).toBe(false);
  });

  it('is stale 1 ms past 5 h', () => {
    expect(isStreamStale(stream, resolvedAt + 5 * HOUR + 1)).toBe(true);
  });

  it('is stale after the ~6 h expiry', () => {
    expect(isStreamStale(stream, resolvedAt + 6 * HOUR)).toBe(true);
  });
});
