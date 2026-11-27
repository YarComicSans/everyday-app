import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { DepartureRow } from '@/components/departure-row';
import type { RowStatus } from '@/components/departure-row/types';
import { ErrorView } from '@/components/error-view';
import { useAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { favoriteKey, useFavorites } from '@/services/favorites';
import {
  combineDepartures,
  DAY_TYPE_LABEL,
  decodeSelection,
  getServiceDay,
  loadRoutes,
  loadTimetable,
  nextDepartureIndex,
  nowDepartureIndex,
  routeKey,
  tripMinutes,
  type Departure,
  type DirectionRef,
  type Route,
} from '@/services/gspns';

import { FavoriteDialog } from './components/favorite-dialog';
import type { FavoriteDialogMode } from './components/favorite-dialog/types';
import { FavoriteToggle } from './components/favorite-toggle';
import { missingText, nowSummary, rowLayout, stopDetails } from './helpers';
import { styles } from './styles';

export default function TimetableScreen() {
  const { lines: linesParam } = useLocalSearchParams<{ lines?: string }>();
  const selection = useMemo(() => decodeSelection(linesParam), [linesParam]);
  const { favorites, save, remove } = useFavorites();
  const favorite = favorites.find((f) => f.key === favoriteKey(selection));
  const [dialog, setDialog] = useState<FavoriteDialogMode | null>(null);
  const confirmDialog = (name: string) => {
    if (favorite) remove(favorite.key);
    else save(selection, name);
    setDialog(null);
  };
  // Rendered in every state, so the star and title don't wait for the timetable to load.
  const favoriteControls = selection.length > 0 && (
    <>
      {favorite && <Stack.Title>{favorite.name}</Stack.Title>}
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.View>
          <FavoriteToggle
            saved={favorite !== undefined}
            onPress={() => setDialog(favorite ? { kind: 'remove', name: favorite.name } : { kind: 'save' })}
          />
        </Stack.Toolbar.View>
      </Stack.Toolbar>
      <FavoriteDialog mode={dialog} onConfirm={confirmDialog} onCancel={() => setDialog(null)} />
    </>
  );
  const now = useNow();
  const service = getServiceDay(now);
  /** Fractional service minute, for "in N min" and which stop is next. */
  const nowMinute = service.minute + now.getSeconds() / 60;

  // Keyed by service date: coming back to the app on another service day refetches.
  const result = useAsync(`timetable:${linesParam}:${service.date}`, () =>
    loadTimetable(selection, new Date()),
  );
  const listRef = useRef<FlatList<Departure>>(null);
  const didAutoScroll = useRef(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const toggle = useCallback((i: number) => setExpandedIndex((e) => (e === i ? null : i)), []);

  const combined = useMemo(
    () => (result.status === 'success' ? combineDepartures(selection, result.data.lines) : null),
    [result.status, result.data, selection],
  );

  // Stop lists load in the background; the timetable never waits for them.
  const directions = useMemo(() => {
    const unique = new Map<string, DirectionRef>();
    for (const d of combined?.departures ?? []) unique.set(routeKey(d), d);
    return [...unique.values()];
  }, [combined]);
  const validFrom = result.status === 'success' ? result.data.day.validFrom : '';
  const routesResult = useAsync(`routes:${validFrom}:${directions.map(routeKey).join(',')}`, () =>
    validFrom ? loadRoutes(validFrom, directions) : Promise.resolve<Record<string, Route>>({}),
  );
  const routes = routesResult.status === 'success' ? routesResult.data : undefined;
  const routesLoading = routesResult.status === 'loading';

  if (result.status === 'error') {
    return (
      <ThemedView style={styles.container}>
        {favoriteControls}
        <ErrorView error={result.error} onRetry={result.retry} />
      </ThemedView>
    );
  }
  if (result.status === 'loading' || !combined) {
    return (
      <ThemedView style={styles.container}>
        {favoriteControls}
        <SafeAreaView edges={['top']}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const { departures, missing } = combined;
  const routeOf = (d: Departure) => routes?.[routeKey(d)];
  const next = nextDepartureIndex(departures, service.minute);
  const onRoad = nowDepartureIndex(departures, service.minute, (d) => tripMinutes(routeOf(d)));
  const canExpand = (i: number) => i === onRoad || (next !== -1 && i >= next);
  const expanded = expandedIndex !== null && canExpand(expandedIndex) ? expandedIndex : -1;
  const expandedDetails =
    expanded === -1
      ? undefined
      : stopDetails(departures[expanded], routeOf(departures[expanded]), {
          onRoad: expanded === onRoad,
          nowMinute,
          loading: routesLoading,
        });
  const layout = {
    now: onRoad,
    expanded,
    expandedLines: expandedDetails?.kind === 'stops' ? expandedDetails.stops.length : 1,
  };

  const statusOf = (i: number, d: Departure): RowStatus =>
    i === onRoad ? 'now' : i === next ? 'next' : d.serviceMinute < service.minute ? 'past' : 'upcoming';

  // Open on the bus on the road, or the one before NEXT for context.
  const fallback = next === -1 ? departures.length - 1 : Math.max(0, next - 1);
  const scrollTo = onRoad === -1 ? fallback : Math.min(onRoad, fallback);

  return (
    <ThemedView style={styles.container}>
      {favoriteControls}
      {/* iOS: the safe area includes the translucent header, so this sits below it. */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="smallBold">{DAY_TYPE_LABEL[result.data.day.dayType]}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Times are departures from the starting terminal. Tap a bus for estimated stop times.
        </ThemedText>
        {missing.map((m) => (
          <ThemedView key={m.lineNumber} type="backgroundElement" style={styles.notice}>
            <ThemedText type="small">{missingText(m)}</ThemedText>
          </ThemedView>
        ))}
        {departures.length > 0 && next === -1 && (
          <ThemedView type="backgroundElement" style={styles.notice}>
            <ThemedText type="small">No more departures today.</ThemedText>
          </ThemedView>
        )}
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.list}>
        <FlatList
          data={departures}
          keyExtractor={(d, i) => `${d.lineNumber}-${d.direction}-${d.serviceMinute}-${i}`}
          getItemLayout={(_, index) => rowLayout(index, layout)}
          ref={listRef}
          // initialScrollIndex is unreliable inside the native stack on iOS; jump once laid out.
          onLayout={() => {
            if (didAutoScroll.current || departures.length === 0) return;
            didAutoScroll.current = true;
            listRef.current?.scrollToOffset({ offset: rowLayout(scrollTo, layout).offset, animated: false });
          }}
          extraData={`${now.getTime()}:${expanded}:${onRoad}:${routesResult.status}`}
          renderItem={({ item, index }) => (
            <DepartureRow
              departure={item}
              index={index}
              status={statusOf(index, item)}
              summary={index === onRoad ? nowSummary(item, routeOf(item), nowMinute) : undefined}
              details={index === expanded ? expandedDetails : undefined}
              onToggle={canExpand(index) ? toggle : undefined}
            />
          )}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="small" themeColor="textSecondary">
                No departures for this selection today.
              </ThemedText>
            </ThemedView>
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}
