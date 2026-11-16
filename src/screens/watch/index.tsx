import { router, useLocalSearchParams } from 'expo-router';
import { VideoView } from 'expo-video';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { ErrorView } from '@/components/error-view';
import { VideoRow } from '@/components/video-row';
import type { VideoSummary } from '@/services/youtube';

import { QualityControl } from './components/quality-control';
import { UpNextOverlay } from './components/up-next-overlay';
import { infoLine, parseStartAt, relatedMeta } from './helpers';
import { styles } from './styles';
import { useWatchSession } from './use-watch-session';

export default function WatchScreen() {
  const { id = '', t } = useLocalSearchParams<{ id?: string; t?: string }>();
  const { player, status, video, related, upNext, qualityMode, setQualityMode, retry } = useWatchSession(
    id,
    parseStartAt(t),
  );
  const insets = useSafeAreaInsets();

  // Replace, so Back always returns to Search. Pause first so audio never overlaps the next page.
  const open = useCallback(
    (next: VideoSummary) => {
      player.pause();
      router.replace({ pathname: '/video/watch', params: { id: next.id } });
    },
    [player],
  );

  const replay = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- seeking the expo-video player is a mutation by design
    player.currentTime = 0;
    player.play();
  }, [player]);

  if (status.state === 'error') {
    return (
      <ThemedView style={styles.container}>
        <ErrorView error={status.error} onRetry={retry} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.player}>
        {status.state === 'loading' ? (
          <ActivityIndicator color="#ffffff" style={styles.loading} />
        ) : (
          <VideoView player={player} style={styles.video} nativeControls />
        )}
        {status.state === 'ended' && upNext && (
          <UpNextOverlay
            thumbnailUrl={upNext.thumbnailUrl}
            title={upNext.title}
            onPlay={() => open(upNext)}
            onReplay={replay}
          />
        )}
      </View>

      <FlatList
        data={related}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        ListHeaderComponent={
          video ? (
            <View style={styles.info}>
              <ThemedText type="subtitle" style={styles.title} numberOfLines={2}>
                {video.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {infoLine(video)}
              </ThemedText>
              <QualityControl value={qualityMode} onChange={setQualityMode} />
              {related.length > 0 && (
                <ThemedText type="smallBold" style={styles.relatedHeader}>
                  Related
                </ThemedText>
              )}
            </View>
          ) : undefined
        }
        renderItem={({ item }) => (
          <VideoRow
            thumbnailUrl={item.thumbnailUrl}
            title={item.title}
            channel={item.channel}
            durationSeconds={item.durationSeconds}
            meta={relatedMeta(item)}
            onPress={() => open(item)}
          />
        )}
      />
    </ThemedView>
  );
}
