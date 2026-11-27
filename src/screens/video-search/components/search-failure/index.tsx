import { Pressable, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';
import type { SearchFailureProps } from './types';

/** A failed search: one message, an optional hint, and Retry. */
export function SearchFailure({ failure, onRetry }: SearchFailureProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{failure.message}</ThemedText>
      {failure.hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {failure.hint}
        </ThemedText>
      ) : null}
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.retry,
          { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
        ]}>
        <ThemedText type="smallBold">Retry</ThemedText>
      </Pressable>
    </View>
  );
}
