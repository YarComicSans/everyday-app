import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { History } from './history';
import type { HistoryEntry } from './types';

/** History for a screen: re-read every time the screen gains focus and after each change. */
export function useHistoryOf(history: History) {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => history.list());
  const refresh = useCallback(() => setEntries(history.list()), [history]);

  useFocusEffect(refresh);

  const remove = useCallback(
    (videoId: string) => {
      history.remove(videoId);
      refresh();
    },
    [history, refresh],
  );
  const clear = useCallback(() => {
    history.clear();
    refresh();
  }, [history, refresh]);

  return { entries, remove, clear, refresh };
}
