import Storage from 'expo-sqlite/kv-store';
import { useCallback, useSyncExternalStore } from 'react';

import type { QualityMode } from './types';

const KEY = 'playback.qualityMode';
const DEFAULT_MODE: QualityMode = 'auto';
const MODES: readonly QualityMode[] = ['auto', 'data-saver', 'best'];

const listeners = new Set<() => void>();

/** The remembered Quality Mode, read synchronously so the player starts with the right cap. */
export function getQualityMode(): QualityMode {
  try {
    const stored = Storage.getItemSync(KEY);
    return MODES.includes(stored as QualityMode) ? (stored as QualityMode) : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function setQualityMode(mode: QualityMode): void {
  Storage.setItemSync(KEY, mode);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The Quality Mode and its setter; every user re-renders when any of them changes it. */
export function useQualityMode(): [QualityMode, (mode: QualityMode) => void] {
  const mode = useSyncExternalStore(subscribe, getQualityMode);
  const setMode = useCallback((next: QualityMode) => setQualityMode(next), []);
  return [mode, setMode];
}
