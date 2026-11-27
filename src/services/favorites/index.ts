import { createFavorites } from './favorites';
import { fileStorage } from './file-storage';
import { useFavoritesOf } from './use-favorites';

/** Bus Timetable Favorites, kept on the device. The file is read on first use, not on import. */
const favorites = createFavorites(fileStorage());

/** `{ favorites, save, remove }`, re-read whenever the screen regains focus. */
export const useFavorites = () => useFavoritesOf(favorites);

export { DEFAULT_FAVORITE_NAME, favoriteKey, withCurrentValues } from './favorites';
export type { Favorite } from './types';
