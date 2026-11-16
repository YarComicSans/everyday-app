import { Pressable, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { QualityMode } from '@/services/playback';

import { styles } from './styles';
import type { QualityControlProps } from './types';

const MODES: { mode: QualityMode; label: string }[] = [
  { mode: 'auto', label: 'Auto' },
  { mode: 'data-saver', label: 'Data Saver' },
  { mode: 'best', label: 'Best' },
];

/** Inline "Quality [Auto | Data Saver | Best]" segmented control. */
export function QualityControl({ value, onChange }: QualityControlProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        Quality
      </ThemedText>
      <View accessibilityRole="radiogroup" style={[styles.segments, { backgroundColor: theme.backgroundElement }]}>
        {MODES.map(({ mode, label }) => {
          const selected = mode === value;
          return (
            <Pressable
              key={mode}
              onPress={() => !selected && onChange(mode)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.segment, selected && { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type={selected ? 'smallBold' : 'small'}>{label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
