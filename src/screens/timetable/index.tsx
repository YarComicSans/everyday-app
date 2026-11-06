import { useLocalSearchParams } from 'expo-router';
import { useMemo, useRef } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { ErrorView } from '@/components/error-view';
import { useAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import {
  combineDepartures,
  DAY_TYPE_LABEL,
  decodeSelection,
  getServiceDay,
  loadTimetable,
  nextDepartureIndex,
  type Departure,
} from '@/services/gspns';

import { DepartureRow } from './components/departure-row';
import { ROW_HEIGHT } from './components/departure-row/styles';
import { missingText } from './helpers';
import { styles } from './styles';

export default function TimetableScreen() {
  const { lines: linesParam } = useLocalSearchParams<{ lines?: string }>();
  const selection = useMemo(() => decodeSelection(linesParam), [linesParam]);
  const now = useNow();
  const service = getServiceDay(now);

  // Keyed by service date: coming back to the app on another service day refetches.
  const result = useAsync(`timetable:${linesParam}:${service.date}`, () =>
    loadTimetable(selection, new Date()),
  );
  const listRef = useRef<FlatList<Departure>>(null);
  const didAutoScroll = useRef(false);

  const combined = useMemo(
    () => (result.status === 'success' ? combineDepartures(selection, result.data.lines) : null),
    [result.status, result.data, selection],
  );

  if (result.status === 'error') {
    return (
      <ThemedView style={styles.container}>
        <ErrorView error={result.error} onRetry={result.retry} />
      </ThemedView>
    );
  }
  if (result.status === 'loading' || !combined) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  const { departures, missing } = combined;
  const next = nextDepartureIndex(departures, service.minute);
  const scrollTo = next === -1 ? departures.length - 1 : Math.max(0, next - 1);

  return (
    <ThemedView style={styles.container}>
      {/* iOS: the safe area includes the translucent header, so this sits below it. */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <ThemedText type="smallBold">{DAY_TYPE_LABEL[result.data.day.dayType]}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Times are departures from the starting terminal, not arrivals at your stop.
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
          getItemLayout={(_, index) => ({ length: ROW_HEIGHT, offset: ROW_HEIGHT * index, index })}
          ref={listRef}
          // initialScrollIndex is unreliable inside the native stack on iOS; jump once laid out.
          onLayout={() => {
            if (didAutoScroll.current || departures.length === 0) return;
            didAutoScroll.current = true;
            listRef.current?.scrollToOffset({ offset: ROW_HEIGHT * scrollTo, animated: false });
          }}
          extraData={service.minute}
          renderItem={({ item, index }) => (
            <DepartureRow departure={item} past={item.serviceMinute < service.minute} next={index === next} />
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
