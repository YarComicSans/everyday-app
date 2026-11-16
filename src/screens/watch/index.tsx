import { useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';

import { styles } from './styles';

/** Placeholder until the real Watch page lands; shows the params it was opened with. */
export default function WatchScreen() {
  const { id, t } = useLocalSearchParams<{ id?: string; t?: string }>();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">Watch page coming soon</ThemedText>
      <ThemedText type="code" selectable>
        id: {id ?? '(none)'}
      </ThemedText>
      <ThemedText type="code" selectable>
        t: {t ?? '(none)'}
      </ThemedText>
    </ThemedView>
  );
}
