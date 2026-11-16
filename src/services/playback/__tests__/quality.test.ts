import { maxResolutionFor } from '../quality';

// An iPhone 15-class screen as `Dimensions.get('screen')` reports it in portrait.
const phone = { width: 393, height: 852, scale: 3 };

describe('maxResolutionFor', () => {
  it('has no cap in Auto', () => {
    expect(maxResolutionFor('auto', phone)).toBeNull();
  });

  it('caps Data Saver at 480p', () => {
    expect(maxResolutionFor('data-saver', phone)).toEqual({ width: 854, height: 480 });
  });

  it('caps Best at the screen size in physical pixels, landscape like the Video', () => {
    expect(maxResolutionFor('best', phone)).toEqual({ width: 2556, height: 1179 });
  });

  it('gives the same Best cap whichever way the phone is held', () => {
    expect(maxResolutionFor('best', { width: 852, height: 393, scale: 3 })).toEqual({
      width: 2556,
      height: 1179,
    });
  });

  it('rounds fractional physical sizes', () => {
    expect(maxResolutionFor('best', { width: 411.4, height: 890.3, scale: 2.625 })).toEqual({
      width: 2337,
      height: 1080,
    });
  });
});
