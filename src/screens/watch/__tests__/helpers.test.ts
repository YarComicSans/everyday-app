import { VideoError } from '@/services/youtube';

import {
  infoLine,
  isRealEnd,
  isSaveDue,
  parseStartAt,
  recoveryAfter,
  streamFailureOutcome,
  youtubeWatchUrl,
} from '../helpers';

describe('parseStartAt', () => {
  it('reads the t= param as seconds', () => {
    expect(parseStartAt('90')).toBe(90);
  });

  it('keeps t=0, so it still beats the Resume Position', () => {
    expect(parseStartAt('0')).toBe(0);
  });

  it.each([undefined, '', 'abc', '-5'])('is undefined for t=%p, so the Resume Position applies', (t) => {
    expect(parseStartAt(t)).toBeUndefined();
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

describe('streamFailureOutcome', () => {
  const android403 = 'a playback exception has returned: source error Response code: 403';
  const ios403 = 'CoreMediaErrorDomain error -12660 - HTTP 403: Forbidden';
  const playlist403 = Object.assign(new Error('Master playlist request failed'), { status: 403 });

  it('re-resolves a Stream rejected with a 403 when no re-resolve is pending', () => {
    expect(streamFailureOutcome(android403, null, 'player')).toEqual({ reResolve: true });
    expect(streamFailureOutcome(ios403, null, 'player')).toEqual({ reResolve: true });
  });

  it('re-resolves when the iOS master playlist request is rejected with a 403', () => {
    expect(streamFailureOutcome(playlist403, null, 'source')).toEqual({ reResolve: true });
  });

  it('shows a 403 that comes before playback moved past the last re-resolve, instead of looping', () => {
    expect(streamFailureOutcome(android403, { restoredAt: 120 }, 'player')).toMatchObject({
      error: { kind: 'failed', code: 'http-403' },
    });
    expect(streamFailureOutcome(playlist403, { restoredAt: 120 }, 'source')).toMatchObject({
      error: { kind: 'failed', code: 'http-403' },
    });
  });

  it('shows any other player error as a failed playback with the given code', () => {
    expect(streamFailureOutcome('source error Response code: 500', null, 'player')).toMatchObject({
      error: { kind: 'failed', code: 'player' },
    });
    expect(streamFailureOutcome('decoder init failed (code 4030)', null, 'player')).toMatchObject({
      error: { kind: 'failed', code: 'player' },
    });
  });

  it('shows a VideoError (e.g. from resolving the Stream again) as it is', () => {
    const limited = new VideoError('limited');
    expect(streamFailureOutcome(limited, null, 'reresolve')).toEqual({ error: limited });
    const http403 = new VideoError('failed', { code: 'http-403' });
    expect(streamFailureOutcome(http403, null, 'reresolve')).toEqual({ error: http403 });
  });
});

describe('recoveryAfter', () => {
  it('keeps a re-resolve pending until playback moves past its restore point', () => {
    const recovery = { restoredAt: 120 };
    expect(recoveryAfter(recovery, 120)).toBe(recovery);
    expect(recoveryAfter(recovery, 121)).toBe(recovery);
    expect(recoveryAfter(recovery, 0)).toBe(recovery);
  });

  it('clears it once playback has really progressed', () => {
    expect(recoveryAfter({ restoredAt: 120 }, 122)).toBeNull();
  });

  it('stays clear when nothing is pending', () => {
    expect(recoveryAfter(null, 5)).toBeNull();
  });
});

describe('youtubeWatchUrl', () => {
  it('links to the Video on youtube.com', () => {
    expect(youtubeWatchUrl('aqz-KE-bpKQ')).toBe('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
  });
});
