import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { LineBadge } from '@/components/line-badge';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/services/gspns';

import { NOW_BACKGROUND, NOW_COLOR, styles } from './styles';
import type { DepartureRowProps, NowSummary, StopDetails } from './types';

const SCHOOL_TAG = '#F76B1533';

export const DepartureRow = memo(function DepartureRow({
  departure: d,
  index,
  status,
  summary,
  details,
  onToggle,
}: DepartureRowProps) {
  const theme = useTheme();
  const expanded = details !== undefined;

  return (
    <Pressable
      disabled={!onToggle}
      onPress={() => onToggle?.(index)}
      accessibilityRole={onToggle ? 'button' : undefined}
      accessibilityState={onToggle ? { expanded } : undefined}
      accessibilityHint={onToggle ? 'Shows estimated stop times' : undefined}
      style={[
        styles.container,
        { borderColor: theme.backgroundElement, opacity: status === 'past' ? 0.35 : 1 },
        status === 'next' && { backgroundColor: theme.backgroundSelected },
        status === 'now' && { backgroundColor: NOW_BACKGROUND },
      ]}>
      <View style={styles.row}>
        <ThemedText style={styles.time}>{formatTime(d)}</ThemedText>
        <LineBadge line={d.lineNumber} />
        <View style={styles.body}>
          <ThemedText type="small" numberOfLines={1}>
            from {d.terminal}
          </ThemedText>
          {(d.lowFloor || d.codes.length > 0) && (
            <View style={styles.tags}>
              {d.lowFloor && (
                <SymbolView
                  name={{ ios: 'figure.roll', android: 'accessible', web: 'accessible' }}
                  tintColor={theme.textSecondary}
                  size={14}
                  fallback={<Text style={styles.tagText}>♿</Text>}
                  accessibilityLabel="Low-floor bus with ramp"
                />
              )}
              {d.codes.map((c) => (
                <View
                  key={c.code}
                  style={[styles.tag, { backgroundColor: c.school ? SCHOOL_TAG : theme.backgroundElement }]}>
                  <Text style={[styles.tagText, { color: theme.textSecondary }]} numberOfLines={1}>
                    {c.school ? 'School · ' : ''}
                    {c.code}
                    {c.meaning ? ` · ${c.meaning}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
        {status === 'now' && (
          <ThemedText type="smallBold" style={[styles.statusLabel, { color: NOW_COLOR }]}>
            NOW
          </ThemedText>
        )}
        {status === 'next' && (
          <ThemedText type="smallBold" style={styles.statusLabel}>
            NEXT
          </ThemedText>
        )}
        {onToggle && (
          <View style={styles.chevron}>
            <SymbolView
              name={
                expanded
                  ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
                  : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
              }
              tintColor={theme.textSecondary}
              size={14}
              fallback={<Text style={[styles.tagText, { color: theme.textSecondary }]}>{expanded ? '▲' : '▼'}</Text>}
            />
          </View>
        )}
      </View>
      {summary && <Summary summary={summary} />}
      {details && <Details details={details} />}
    </Pressable>
  );
});

function Summary({ summary }: { summary: NowSummary }) {
  return (
    <View style={styles.summary}>
      {summary.nextStop && (
        <ThemedText type="small" numberOfLines={1} style={styles.summaryStop}>
          Next: {summary.nextStop} ·
        </ThemedText>
      )}
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        arr {summary.arrival} · {summary.fromNow} · estimated
      </ThemedText>
    </View>
  );
}

function Details({ details }: { details: StopDetails }) {
  return (
    <View style={styles.details}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.detailsLabel}>
        Estimated times
      </ThemedText>
      {details.kind === 'stops' ? (
        details.stops.map((s, i) => (
          <View key={`${s.name}-${i}`} style={styles.stop}>
            <ThemedText type="small" style={styles.stopTime}>
              {s.time}
            </ThemedText>
            <ThemedText type="small" numberOfLines={1} style={styles.stopName}>
              {s.name}
            </ThemedText>
          </View>
        ))
      ) : (
        <View style={styles.stop}>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {details.kind === 'loading' ? 'Loading stops…' : 'Stop list isn’t available for this line.'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}
