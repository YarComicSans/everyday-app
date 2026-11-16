import { useNetworkState } from 'expo-network';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';

import { ThemedText } from '@/base/themed-text';
import { ThemedView } from '@/base/themed-view';
import { VideoRow } from '@/components/video-row';
import { metaLine } from '@/components/video-row/helpers';
import { useAsync } from '@/hooks/use-async';
import { useHistory } from '@/services/history';
import { search, type VideoSummary } from '@/services/youtube';

import { SearchBox } from './components/search-box';
import { SearchFailure } from './components/search-failure';
import { searchAvailability, searchFailure, submitTarget, watchedFraction, type WatchParams } from './helpers';
import { styles } from './styles';

const openWatch = (params: WatchParams) => router.push({ pathname: '/video/watch', params });

export default function VideoSearchScreen() {
  const history = useHistory();
  const [text, setText] = useState('');
  // The submitted query; null shows History.
  const [query, setQuery] = useState<string | null>(null);
  const results = useAsync(`search:${query ?? ''}`, () =>
    query ? search(query) : Promise.resolve<VideoSummary[]>([]),
  );

  const network = useNetworkState();
  const { offline, failure } = searchAvailability(
    network.isInternetReachable,
    query && results.status === 'error' ? searchFailure(results.error) : null,
  );

  const byId = useMemo(() => new Map(history.entries.map((e) => [e.videoId, e])), [history.entries]);

  const changeText = useCallback((next: string) => {
    setText(next);
    if (!next.trim()) setQuery(null);
  }, []);

  const submit = () => {
    const target = submitTarget(text);
    if (!target) return;
    if (target.type === 'watch') openWatch(target.params);
    else if (target.query === query) results.retry();
    else setQuery(target.query);
  };

  const { remove, clear } = history;
  const confirmClear = () =>
    Alert.alert('Clear History?', 'All Videos and Resume Positions will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);

  // History stays browsable while offline, and after a failure that no longer applies (back online).
  const showHistory = !query || offline || (results.status === 'error' && !failure);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.top}>
        <SearchBox value={text} onChangeText={changeText} onSubmit={submit} disabled={offline} />
        {failure && <SearchFailure failure={failure} onRetry={results.retry} />}
      </View>

      {showHistory ? (
        <FlatList
          data={history.entries}
          keyExtractor={(entry) => entry.videoId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            history.entries.length > 0 ? (
              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold">History</ThemedText>
                <Pressable onPress={confirmClear} accessibilityRole="button" hitSlop={8}>
                  <ThemedText type="small" themeColor="textSecondary">
                    Clear History
                  </ThemedText>
                </Pressable>
              </View>
            ) : undefined
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              Videos you watch will appear here.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <VideoRow
              thumbnailUrl={item.thumbnailUrl}
              title={item.title}
              channel={item.channel}
              durationSeconds={item.durationSeconds}
              watchedFraction={watchedFraction(item)}
              onPress={() => openWatch({ id: item.videoId })}
              onLongPress={() => remove(item.videoId)}
            />
          )}
        />
      ) : results.status === 'loading' ? (
        <ActivityIndicator style={styles.loading} />
      ) : results.status === 'success' ? (
        <FlatList
          data={results.data}
          keyExtractor={(video) => video.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
              No results for “{query}”.
            </ThemedText>
          }
          renderItem={({ item }) => (
            <VideoRow
              thumbnailUrl={item.thumbnailUrl}
              title={item.title}
              channel={item.channel}
              durationSeconds={item.durationSeconds}
              meta={metaLine(item)}
              watchedFraction={watchedFraction(byId.get(item.id))}
              onPress={() => openWatch({ id: item.id })}
            />
          )}
        />
      ) : null}
    </ThemedView>
  );
}
