import { Pressable, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { LineBadge, lineColor } from '@/components/line-badge';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';
import type { DirectionPickerProps } from './types';

/** One selected line: pick which end it starts from (one direction per line). */
export function DirectionPicker({ line, selectedIndex, onSelect, onRemove }: DirectionPickerProps) {
  const theme = useTheme();
  const color = lineColor(line.id);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <LineBadge line={line.id} size="sm" />
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.name}>
          {line.name}
        </ThemedText>
        <Pressable onPress={onRemove} hitSlop={12} style={styles.remove} accessibilityLabel={`Remove line ${line.id}`}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      </View>

      {line.directions.map((dir, i) => {
        const selected = i === selectedIndex;
        return (
          <Pressable
            key={dir.label + i}
            onPress={() => onSelect(i)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            style={[styles.option, selected && { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.radio, { borderColor: selected ? color : theme.textSecondary }]}>
              {selected && <View style={[styles.radioDot, { backgroundColor: color }]} />}
            </View>
            <ThemedText type={selected ? 'smallBold' : 'small'} style={styles.optionLabel}>
              {dir.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}
