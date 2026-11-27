import type { LineSelection } from '@/services/gspns';

/** A named, saved set of Lines, each with its Direction, reopened as one Timetable. */
export type Favorite = {
  /** Order-independent identity of `selection`; see `favoriteKey`. */
  key: string;
  name: string;
  /**
   * As picked. `value` is the GSP request value at save time; it is refreshed from the
   * current line list before use, since only the Line number and Direction identify a Line.
   */
  selection: LineSelection[];
  /** Epoch ms; Favorites are listed in the order they were saved. */
  createdAt: number;
};

/** Where Favorites are kept. A JSON file in the app, an in-memory array in tests. */
export type FavoritesStorage = {
  read(): Favorite[];
  write(favorites: Favorite[]): void;
};
