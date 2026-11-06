import { View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';

import { styles } from './styles';
import type { HintRowProps } from './types';

export function HintRow({ title = 'Try editing', hint = 'app/index.tsx' }: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary">{hint}</ThemedText>
      </ThemedView>
    </View>
  );
}
