import { useCallback, useEffect, useEffectEvent, useState } from 'react';

export type AsyncState<T> =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'error'; data?: undefined; error: unknown }
  | { status: 'success'; data: T; error?: undefined };

/**
 * Runs `load` whenever `key` changes (and on `retry`), exposing loading / error / data.
 * `key` must describe everything `load` depends on; results for a stale key are ignored.
 */
export function useAsync<T>(key: string, load: () => Promise<T>): AsyncState<T> & { retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ id: string; data?: T; error?: unknown; ok: boolean } | null>(null);
  const run = useEffectEvent(load);
  const id = `${key}#${attempt}`;

  useEffect(() => {
    let live = true;
    run().then(
      (data) => live && setResult({ id, data, ok: true }),
      (error: unknown) => live && setResult({ id, error, ok: false }),
    );
    return () => {
      live = false;
    };
  }, [id]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  if (!result || result.id !== id) return { status: 'loading', retry };
  if (!result.ok) return { status: 'error', error: result.error, retry };
  return { status: 'success', data: result.data as T, retry };
}
