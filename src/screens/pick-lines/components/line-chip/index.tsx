import { Pressable } from 'react-native';

import { LineBadge } from '@/components/line-badge';

import type { LineChipProps } from './types';

export function LineChip({ id, selected, onPress }: LineChipProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`Line ${id}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <LineBadge line={id} muted={!selected} />
    </Pressable>
  );
}
