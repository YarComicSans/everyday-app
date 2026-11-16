import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { useTheme } from '@/hooks/use-theme';

import { formatDuration } from './helpers';
import { styles } from './styles';
import type { VideoRowProps } from './types';

export const VideoRow = memo(function VideoRow({
  thumbnailUrl,
  title,
  channel,
  durationSeconds,
  meta,
  progress,
  onPress,
  onLongPress,
}: VideoRowProps) {
  const theme = useTheme();
  const duration = formatDuration(durationSeconds);
  const watched = progress !== undefined ? Math.min(1, Math.max(0, progress)) : 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={[title, channel, duration].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.container, pressed && { backgroundColor: theme.backgroundSelected }]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundElement }]}>
        <Image
          source={thumbnailUrl}
          style={styles.image}
          contentFit="cover"
          transition={150}
          recyclingKey={thumbnailUrl}
        />
        {duration && (
          <View style={styles.duration}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        )}
        {watched > 0 && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${watched * 100}%` }]} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {channel}
        </ThemedText>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {meta}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
});
