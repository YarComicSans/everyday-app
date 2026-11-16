import { formatDuration } from '../helpers';

describe('formatDuration', () => {
  it.each([
    [5, '0:05'],
    [59, '0:59'],
    [60, '1:00'],
    [754, '12:34'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
    [36000, '10:00:00'],
    [90.7, '1:30'],
  ])('formats %p seconds as %p', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });

  it.each([0, -3, NaN])('returns null for %p so the badge is hidden', (seconds) => {
    expect(formatDuration(seconds)).toBeNull();
  });
});
