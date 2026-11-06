import { Text } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';
import type { ThemedTextProps } from './types';

export type { ThemedTextProps } from './types';

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return <Text style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}
