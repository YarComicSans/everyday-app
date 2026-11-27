import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { LineSelection } from '@/services/gspns';

import type { Favorites } from './favorites';
import type { Favorite } from './types';

/** Favorites for a screen: re-read whenever the screen gains focus and after each change. */
export function useFavoritesOf(favorites: Favorites) {
  const [list, setList] = useState<Favorite[]>(() => favorites.list());
  const refresh = useCallback(() => setList(favorites.list()), [favorites]);

  useFocusEffect(refresh);

  const save = useCallback(
    (selection: LineSelection[], name: string) => {
      favorites.save(selection, name);
      refresh();
    },
    [favorites, refresh],
  );
  const remove = useCallback(
    (key: string) => {
      favorites.remove(key);
      refresh();
    },
    [favorites, refresh],
  );

  return { favorites: list, save, remove };
}
