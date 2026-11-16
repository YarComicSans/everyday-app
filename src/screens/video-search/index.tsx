import { router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { VideoRow } from '@/components/video-row';
import { useTheme } from '@/hooks/use-theme';

import { styles } from './styles';

/** Placeholder until the real Search screen lands; opens a sample Watch page. */
const SAMPLE = {
  id: 'jNQXAC9IVRw',
  title: 'Me at the zoo',
  channel: 'jawed',
  durationSeconds: 19,
  thumbnailUrl: 'https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg',
};

const openSample = () => router.push({ pathname: '/video/watch', params: { id: SAMPLE.id, t: '5' } });

export default function VideoSearchScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Search is coming soon.
        </ThemedText>
        <VideoRow {...SAMPLE} meta="Sample video" progress={0.3} onPress={openSample} />
        <Pressable
          onPress={openSample}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: pressed ? theme.backgroundSelected : theme.backgroundElement },
          ]}>
          <ThemedText type="smallBold">Open sample Watch page</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}
