import { File, Paths } from 'expo-file-system';

import type { Favorite, FavoritesStorage } from './types';

const FILE_NAME = 'bus-favorites.json';

const favoritesFile = () => {
  try {
    return new File(Paths.document, FILE_NAME);
  } catch {
    return null; // no file system (web)
  }
};

/**
 * `FavoritesStorage` in a JSON file in the documents directory: kept across restarts and
 * not cleared with the cache. Without a file system (web) Favorites last for the session.
 */
export function fileStorage(): FavoritesStorage {
  let memory: Favorite[] | null = null;

  return {
    read() {
      if (memory) return memory;
      try {
        const file = favoritesFile();
        const stored: unknown = file?.exists ? JSON.parse(file.textSync()) : [];
        memory = Array.isArray(stored) ? (stored as Favorite[]) : [];
      } catch {
        memory = []; // an unreadable file is the same as no Favorites
      }
      return memory;
    },
    write(favorites) {
      memory = favorites;
      try {
        const file = favoritesFile();
        if (!file) return;
        if (!file.exists) file.create({ intermediates: true });
        file.writeSync(JSON.stringify(favorites));
      } catch {
        // Keep the in-memory copy for this session.
      }
    },
  };
}
