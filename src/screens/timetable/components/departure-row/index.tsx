import { SymbolView } from 'expo-symbols';
import { memo } from 'react';
import { Text, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { LineBadge } from '@/components/line-badge';
import { useTheme } from '@/hooks/use-theme';
import { formatTime } from '@/services/gspns';

import { styles } from './styles';
import type { DepartureRowProps } from './types';

const SCHOOL_TAG = '#F76B1533';

export const DepartureRow = memo(function DepartureRow({ departure: d, past, next }: DepartureRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { borderColor: theme.backgroundElement, opacity: past ? 0.35 : 1 },
        next && { backgroundColor: theme.backgroundSelected },
      ]}>
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
      {next && (
        <ThemedText type="smallBold" style={styles.nextLabel}>
          NEXT
        </ThemedText>
      )}
    </View>
  );
});
