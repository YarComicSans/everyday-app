import type { Favorite, FavoritesStorage } from './types';

/** Non-persistent `FavoritesStorage`, for tests. */
export function memoryStorage(): FavoritesStorage {
  let favorites: Favorite[] = [];
  return {
    read: () => favorites,
    write: (next) => void (favorites = next),
  };
}
