import type { LineInfo, LineSelection } from '@/services/gspns';

import type { Favorite, FavoritesStorage } from './types';

/** Name the save dialog starts with. */
export const DEFAULT_FAVORITE_NAME = 'New Favorite';

/**
 * Identity of a selection: its Lines and Directions, whatever order they were picked in.
 * GSP's request value (`4*`, `3A.`) is left out: it is decoration that may change between
 * timetable versions, while the Line number and Direction don't.
 */
export const favoriteKey = (selection: LineSelection[]) =>
  [...new Set(selection.map((s) => `${s.lineNumber}:${s.direction}`))].sort().join(',');

/**
 * The selection with each Line's request value taken from the current line list.
 * Lines missing from it keep their saved value, so the timetable reports them as not running.
 */
export function withCurrentValues(selection: LineSelection[], lines: LineInfo[]): LineSelection[] {
  return selection.map((s) => {
    const line = lines.find((l) => l.number === s.lineNumber);
    return line ? { ...s, value: line.value } : s;
  });
}

export type Favorites = ReturnType<typeof createFavorites>;

export function createFavorites(storage: FavoritesStorage, now: () => number = Date.now) {
  return {
    /** In the order they were saved. */
    list: (): Favorite[] => [...storage.read()].sort((a, b) => a.createdAt - b.createdAt),
    /** The saved Favorite with these Lines and Directions, if any. */
    find: (selection: LineSelection[]): Favorite | undefined => {
      const key = favoriteKey(selection);
      return storage.read().find((f) => f.key === key);
    },
    /** Saves the selection under `name`. A selection that's already a Favorite is left as it is. */
    save(selection: LineSelection[], name: string): Favorite | undefined {
      const trimmed = name.trim();
      if (selection.length === 0 || !trimmed) return undefined;
      const key = favoriteKey(selection);
      const favorites = storage.read();
      const existing = favorites.find((f) => f.key === key);
      if (existing) return existing;
      const favorite = { key, name: trimmed, selection, createdAt: now() };
      storage.write([...favorites, favorite]);
      return favorite;
    },
    remove(key: string): void {
      storage.write(storage.read().filter((f) => f.key !== key));
    },
  };
}
