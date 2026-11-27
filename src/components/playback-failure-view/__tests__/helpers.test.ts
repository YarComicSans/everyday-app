import { failureContent } from '../helpers';

describe('failureContent', () => {
  it('limited: says YouTube is limiting the network, offers Retry and a switch-network hint', () => {
    expect(failureContent('limited')).toEqual({
      message: 'YouTube is limiting this network',
      hint: 'Try switching between Wi-Fi and mobile data.',
      actions: ['retry'],
    });
  });

  it('unplayable: offers only Open in YouTube', () => {
    expect(failureContent('unplayable')).toEqual({
      message: "Can't be played in this app",
      actions: ['open'],
    });
  });

  it('unavailable: offers only Back, never a pointless Retry', () => {
    expect(failureContent('unavailable')).toEqual({
      message: 'Video unavailable',
      actions: ['back'],
    });
  });

  it('offline: offers Retry', () => {
    expect(failureContent('offline')).toEqual({
      message: "You're offline",
      actions: ['retry'],
    });
  });

  it('failed: shows the short code with Retry and Open in YouTube', () => {
    expect(failureContent('failed', 'http-403')).toEqual({
      message: 'Playback failed',
      code: 'http-403',
      actions: ['retry', 'open'],
    });
  });

  it('failed without a code still shows the message', () => {
    expect(failureContent('failed')).toEqual({
      message: 'Playback failed',
      actions: ['retry', 'open'],
    });
  });
});
