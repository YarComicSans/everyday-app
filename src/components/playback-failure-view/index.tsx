import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/base/themed-text';
import { styles as errorViewStyles } from '@/components/error-view/styles';
import { useTheme } from '@/hooks/use-theme';

import { failureContent } from './helpers';
import { styles } from './styles';
import type { FailureAction, PlaybackFailureViewProps } from './types';

const LABELS: Record<FailureAction, string> = {
  retry: 'Retry',
  open: 'Open in YouTube',
  back: 'Back',
};

/**
 * The error view for playback: one message and set of actions per failure kind,
 * using the error view's layout and buttons.
 */
export function PlaybackFailureView({ kind, code, onRetry, onOpenInYouTube, onBack }: PlaybackFailureViewProps) {
  const theme = useTheme();
  const { message, hint, code: shownCode, actions } = failureContent(kind, code);
  const handlers: Record<FailureAction, () => void> = {
    retry: onRetry,
    open: onOpenInYouTube,
    back: onBack,
  };

  return (
    <SafeAreaView edges={['bottom']} style={[errorViewStyles.container, styles.container]}>
      <View style={styles.text}>
        <ThemedText type="subtitle" style={styles.centered}>
          {message}
        </ThemedText>
        {hint && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            {hint}
          </ThemedText>
        )}
        {shownCode && (
          <ThemedText type="code" themeColor="textSecondary" selectable style={styles.centered}>
            {shownCode}
          </ThemedText>
        )}
      </View>
      {actions.map((action) => (
        <Pressable
          key={action}
          onPress={handlers[action]}
          style={({ pressed }) => [
            errorViewStyles.retry,
            {
              backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement,
            },
          ]}>
          <ThemedText type="smallBold">{LABELS[action]}</ThemedText>
        </Pressable>
      ))}
    </SafeAreaView>
  );
}
