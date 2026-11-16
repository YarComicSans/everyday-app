import type { QualityMode, Resolution, ScreenSize } from './types';

/** Data Saver's cap: 480p. */
const DATA_SAVER_CAP: Resolution = { width: 854, height: 480 };

/**
 * The highest resolution a Quality Mode allows, or `null` for no cap (Auto).
 * Best is the screen in physical pixels (not the highest track), turned landscape so it
 * compares like-for-like with a Video's landscape tracks however the phone is held.
 */
export function maxResolutionFor(mode: QualityMode, screen: ScreenSize): Resolution | null {
  switch (mode) {
    case 'auto':
      return null;
    case 'data-saver':
      return DATA_SAVER_CAP;
    case 'best': {
      const a = Math.round(screen.width * screen.scale);
      const b = Math.round(screen.height * screen.scale);
      return { width: Math.max(a, b), height: Math.min(a, b) };
    }
  }
}
