import {
  infoLine,
  isRealEnd,
  isSaveDue,
  parseStartAt,
  playerErrorOutcome,
  relatedMeta,
  startPosition,
  youtubeWatchUrl,
} from '../helpers';

describe('startPosition', () => {
  const resumeAt = () => 42;

  it('starts at the t= param, which beats the Resume Position', () => {
    expect(startPosition(parseStartAt('90'), resumeAt)).toBe(90);
  });

  it('honours t=0 rather than falling back to the Resume Position', () => {
    expect(startPosition(parseStartAt('0'), resumeAt)).toBe(0);
  });

  it.each([undefined, '', 'abc', '-5'])('falls back to the Resume Position for t=%p', (t) => {
    expect(startPosition(parseStartAt(t), resumeAt)).toBe(42);
  });
});

describe('isSaveDue', () => {
  it('is due once playback has moved about 10 s past the last save', () => {
    expect(isSaveDue(30, 39.5)).toBe(false);
    expect(isSaveDue(30, 40)).toBe(true);
  });

  it('is due after a seek backwards of 10 s or more', () => {
    expect(isSaveDue(120, 60)).toBe(true);
  });

  it('is due on the first tick when nothing was saved yet', () => {
    expect(isSaveDue(null, 1)).toBe(true);
  });
});

describe('isRealEnd', () => {
  it('trusts the end only after real playback', () => {
    expect(isRealEnd(633.2, 634)).toBe(true);
  });

  it('ignores the spurious end Android reports for an empty player', () => {
    expect(isRealEnd(0, 0)).toBe(false);
    expect(isRealEnd(0, 634)).toBe(false);
  });
});

describe('infoLine', () => {
  it('joins channel, views and age with middots', () => {
    expect(
      infoLine({
        channel: 'Blender',
        viewsLabel: '1.2M views',
        publishedLabel: '3 years ago',
      }),
    ).toBe('Blender · 1.2M views · 3 years ago');
  });

  it('skips missing parts', () => {
    expect(infoLine({ channel: 'Blender', publishedLabel: '3 years ago' })).toBe('Blender · 3 years ago');
    expect(infoLine({ channel: 'Blender' })).toBe('Blender');
  });
});

describe('relatedMeta', () => {
  it('is "views · age", or undefined when both are unknown', () => {
    expect(relatedMeta({ viewsLabel: '5K views', publishedLabel: '1 day ago' })).toBe('5K views · 1 day ago');
    expect(relatedMeta({ viewsLabel: '5K views' })).toBe('5K views');
    expect(relatedMeta({})).toBeUndefined();
  });
});

describe('playerErrorOutcome', () => {
  const android403 = 'a playback exception has returned: source error Response code: 403';

  it('re-resolves a Stream rejected with a 403 once', () => {
    expect(playerErrorOutcome(android403, false)).toEqual({ reResolve: true });
  });

  it('recognises the 403 in an iOS-style message too', () => {
    expect(playerErrorOutcome('CoreMediaErrorDomain error -12660 - HTTP 403: Forbidden', false)).toEqual({
      reResolve: true,
    });
  });

  it('shows the error on a second 403 in a row instead of looping', () => {
    expect(playerErrorOutcome(android403, true)).toMatchObject({
      error: { kind: 'failed', code: 'http-403' },
    });
  });

  it('shows any other player error as a failed playback', () => {
    expect(playerErrorOutcome('source error Response code: 500', false)).toMatchObject({
      error: { kind: 'failed', code: 'player' },
    });
    expect(playerErrorOutcome('decoder init failed (code 4030)', false)).toMatchObject({
      error: { kind: 'failed', code: 'player' },
    });
  });
});

describe('youtubeWatchUrl', () => {
  it('links to the Video on youtube.com', () => {
    expect(youtubeWatchUrl('aqz-KE-bpKQ')).toBe('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  });
});
