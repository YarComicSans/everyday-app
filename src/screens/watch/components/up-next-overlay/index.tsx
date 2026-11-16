import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { styles } from './styles';
import type { UpNextOverlayProps } from './types';

/** Covers the player at the end of a Video and offers the Up Next. Never plays anything by itself. */
export function UpNextOverlay({ thumbnailUrl, title, onPlay, onReplay }: UpNextOverlayProps) {
  return (
    <View style={styles.scrim}>
      <Image source={thumbnailUrl} style={styles.thumb} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.label}>Up next</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={styles.actions}>
          <Pressable
            onPress={onPlay}
            accessibilityRole="button"
            accessibilityLabel={`Play ${title}`}
            style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
            <Text style={styles.playText}>▶ Play</Text>
          </Pressable>
          <Pressable
            onPress={onReplay}
            accessibilityRole="button"
            accessibilityLabel="Replay"
            style={({ pressed }) => [styles.replay, pressed && styles.pressed]}>
            <Text style={styles.replayText}>↺ Replay</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
