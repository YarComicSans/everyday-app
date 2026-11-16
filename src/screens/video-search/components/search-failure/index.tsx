import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { SearchFailure as Failure } from '../../helpers';

type SearchFailureProps = { failure: Failure; onRetry: () => void };

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

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  retry: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 12,
  },
});
