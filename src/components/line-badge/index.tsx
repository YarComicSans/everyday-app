import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { lineColor } from './helpers';
import { SIZES, styles } from './styles';
import type { LineBadgeProps } from './types';

export { lineColor } from './helpers';

export function LineBadge({ line, muted, size = 'md' }: LineBadgeProps) {
  const theme = useTheme();
  const color = lineColor(line);
  const dim = SIZES[size];

  return (
    <View
      style={[
        styles.badge,
        { minWidth: dim, height: dim },
        muted
          ? { borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement }
          : { borderColor: color, backgroundColor: color },
      ]}>
      <Text style={[styles.text, { fontSize: dim * 0.42, color: muted ? theme.text : '#fff' }]}>
        {line}
      </Text>
    </View>
  );
}
