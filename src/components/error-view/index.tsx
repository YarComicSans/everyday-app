import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { GspError } from '@/services/gspns';

import { styles } from './styles';
import type { ErrorViewProps } from './types';

/** Shows a failed request as-is (status, URL, raw body) for debugging, with Retry. */
export function ErrorView({ error, onRetry }: ErrorViewProps) {
  const theme = useTheme();
  const gsp = error instanceof GspError ? error : null;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
      <ThemedText type="smallBold">{gsp ? gsp.message : 'Something went wrong'}</ThemedText>
      {gsp && (
        <ThemedText type="code" selectable>
          {gsp.status ? `HTTP ${gsp.status} · ` : ''}
          {gsp.url}
        </ThemedText>
      )}
      <ThemedView type="backgroundElement" style={styles.body}>
        <ScrollView contentContainerStyle={styles.bodyContent}>
          <ThemedText type="code" selectable>
            {gsp ? gsp.body || '(empty response body)' : String(error)}
          </ThemedText>
        </ScrollView>
      </ThemedView>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.retry,
          { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
        ]}>
        <ThemedText type="smallBold">Retry</ThemedText>
      </Pressable>
    </SafeAreaView>
  );
}
