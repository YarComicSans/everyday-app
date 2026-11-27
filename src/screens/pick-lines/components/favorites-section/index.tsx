import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { useAsync } from '@/hooks/use-async';
import { useFavorites, withCurrentValues } from '@/services/favorites';
import { getServiceDay, loadTimetable, type LineSelection } from '@/services/gspns';

import { favoriteNextBuses } from '../../helpers';
import { FavoriteCard } from '../favorite-card';
import type { FavoriteCardState } from '../favorite-card/types';
import { styles } from './styles';
import type { FavoritesSectionProps } from './types';

/** Favorites under the line picker. Departures for all of them come from one request. */
export function FavoritesSection({ hidden, lineInfos, now, onOpen }: FavoritesSectionProps) {
  const { favorites } = useFavorites();
  const service = getServiceDay(now);

  const selections = useMemo(
    () => new Map(favorites.map((f) => [f.key, withCurrentValues(f.selection, lineInfos)])),
    [favorites, lineInfos],
  );
  const union = useMemo(() => {
    const unique = new Map<string, LineSelection>();
    for (const selection of selections.values()) for (const s of selection) unique.set(s.value, s);
    return [...unique.values()];
  }, [selections]);
  const unionKey = union.map((s) => s.value).sort().join(',');

  const result = useAsync(`favorites:${unionKey}:${service.date}`, () =>
    union.length ? loadTimetable(union, new Date()) : Promise.resolve(null),
  );

  if (hidden || favorites.length === 0) return null;

  const stateOf = (selection: LineSelection[]): FavoriteCardState => {
    if (result.status === 'loading') return { kind: 'loading' };
    if (result.status === 'error' || !result.data) return { kind: 'error' };
    return { kind: 'ready', lines: favoriteNextBuses(selection, result.data.lines, service.minute) };
  };

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <ThemedText type="smallBold">Favorites</ThemedText>
        {result.status === 'error' && (
          <Pressable onPress={result.retry} hitSlop={8} accessibilityRole="button">
            <ThemedText type="smallBold" themeColor="textSecondary">
              Retry
            </ThemedText>
          </Pressable>
        )}
      </View>
      {favorites.map((f) => {
        const selection = selections.get(f.key) ?? f.selection;
        return (
          <FavoriteCard
            key={f.key}
            name={f.name}
            lineNumbers={selection.map((s) => s.lineNumber)}
            state={stateOf(selection)}
            onPress={() => onOpen(selection)}
          />
        );
      })}
    </View>
  );
}
