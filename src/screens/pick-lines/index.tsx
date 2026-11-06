import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { ErrorView } from '@/components/error-view';
import { useAsync } from '@/hooks/use-async';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import {
  buildPickerLines,
  DAY_TYPE_LABEL,
  encodeSelection,
  getServiceDay,
  loadLines,
} from '@/services/gspns';

import { DirectionPicker } from './components/direction-picker';
import { LineChip } from './components/line-chip';
import { type PickedLines, pickedSelection, toggleLine } from './helpers';
import { styles } from './styles';

export default function PickLinesScreen() {
  const theme = useTheme();
  const now = useNow();
  const serviceDate = getServiceDay(now).date;
  const result = useAsync(`lines:${serviceDate}`, () => loadLines(new Date()));
  // In-memory only: survives backgrounding and the round-trip to Timetable, not app restarts.
  const [picked, setPicked] = useState<PickedLines>({});

  const lines = useMemo(
    () => (result.status === 'success' ? buildPickerLines(result.data.lines) : []),
    [result.status, result.data],
  );

  if (result.status === 'loading') {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView edges={['top']}>
          <ActivityIndicator style={styles.loading} />
        </SafeAreaView>
      </ThemedView>
    );
  }
  if (result.status === 'error') {
    return (
      <ThemedView style={styles.container}>
        <ErrorView error={result.error} onRetry={result.retry} />
      </ThemedView>
    );
  }

  const { day } = result.data;
  const pickedLines = Object.keys(picked)
    .map((id) => lines.find((l) => l.id === id))
    .filter((l) => l !== undefined);
  const selection = pickedSelection(picked, lines);

  const showTimetable = () =>
    router.push({ pathname: '/bus-timetable/timetable', params: { lines: encodeSelection(selection) } });

  return (
    <ThemedView style={styles.container}>
      {/* iOS: inset content below the translucent header; no-op on Android. */}
      <ScrollView contentContainerStyle={styles.scroll} contentInsetAdjustmentBehavior="automatic">
        <ThemedText type="small" themeColor="textSecondary">
          {DAY_TYPE_LABEL[day.dayType]} timetable · tap the lines you want to compare
        </ThemedText>

        <View style={styles.chips}>
          {lines.map((line) => (
            <LineChip
              key={line.id}
              id={line.id}
              selected={line.id in picked}
              onPress={() => setPicked((p) => toggleLine(p, line.id))}
            />
          ))}
        </View>

        {pickedLines.length > 0 && (
          <View style={styles.section}>
            <ThemedText type="smallBold">Starting from</ThemedText>
            {pickedLines.map((line) => (
              <DirectionPicker
                key={line.id}
                line={line}
                selectedIndex={picked[line.id]}
                onSelect={(index) => setPicked((p) => ({ ...p, [line.id]: index }))}
                onRemove={() => setPicked((p) => toggleLine(p, line.id))}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {selection.length > 0 && (
          <Pressable
            onPress={() => setPicked({})}
            style={[styles.clear, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">Clear</ThemedText>
          </Pressable>
        )}
        <Pressable
          disabled={selection.length === 0}
          onPress={showTimetable}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: selection.length === 0 ? theme.backgroundElement : '#3E63DD',
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          <ThemedText
            type="smallBold"
            style={{ color: selection.length === 0 ? theme.textSecondary : '#fff' }}>
            {selection.length === 0
              ? 'Pick at least one line'
              : `Show timetable (${selection.length} ${selection.length === 1 ? 'line' : 'lines'})`}
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}
