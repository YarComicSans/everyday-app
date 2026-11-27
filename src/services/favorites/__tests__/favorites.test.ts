import { createFavorites, favoriteKey, withCurrentValues } from '../favorites';
import { memoryStorage } from '../memory-storage';

const four = { value: '4*', lineNumber: '4', direction: 'A' as const };
const fourBack = { ...four, direction: 'B' as const };
const sevenA = { value: '7A.', lineNumber: '7A', direction: 'A' as const };

describe('favoriteKey', () => {
  it('is the same whatever order the Lines were picked in', () => {
    expect(favoriteKey([four, sevenA])).toBe(favoriteKey([sevenA, four]));
  });

  it('tells Directions apart', () => {
    expect(favoriteKey([four])).not.toBe(favoriteKey([fourBack]));
  });

  it('ignores the GSP request value, which may change between timetable versions', () => {
    expect(favoriteKey([four])).toBe(favoriteKey([{ ...four, value: '4' }]));
  });
});

describe('withCurrentValues', () => {
  it('takes request values from the current line list and keeps Lines missing from it', () => {
    const lines = [{ value: '4', number: '4', name: 'LIMAN IV - CENTAR' }];
    expect(withCurrentValues([four, sevenA], lines)).toEqual([{ ...four, value: '4' }, sevenA]);
  });
});

describe('favorites', () => {
  it('saves a named Favorite and finds it by its Lines and Directions', () => {
    const favorites = createFavorites(memoryStorage());
    favorites.save([four, sevenA], '  To work ');
    expect(favorites.find([sevenA, four])?.name).toBe('To work');
    expect(favorites.find([fourBack])).toBeUndefined();
  });

  it('refuses a blank name or an empty selection', () => {
    const favorites = createFavorites(memoryStorage());
    expect(favorites.save([four], '   ')).toBeUndefined();
    expect(favorites.save([], 'Home')).toBeUndefined();
    expect(favorites.list()).toEqual([]);
  });

  it('never duplicates a Favorite, but allows duplicate names', () => {
    const favorites = createFavorites(memoryStorage());
    favorites.save([four], 'Home');
    favorites.save([four], 'Other');
    favorites.save([fourBack], 'Home');
    expect(favorites.list().map((f) => f.name)).toEqual(['Home', 'Home']);
  });

  it('lists Favorites in the order they were saved', () => {
    let t = 0;
    const favorites = createFavorites(memoryStorage(), () => ++t);
    favorites.save([sevenA], 'B');
    favorites.save([four], 'A');
    expect(favorites.list().map((f) => f.name)).toEqual(['B', 'A']);
  });

  it('removes by key', () => {
    const favorites = createFavorites(memoryStorage());
    favorites.save([four], 'Home');
    favorites.remove(favoriteKey([four]));
    expect(favorites.list()).toEqual([]);
  });
});
