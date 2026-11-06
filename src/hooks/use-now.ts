import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Current time, refreshed every `intervalMs` and immediately when the app returns
 * to the foreground (timers don't run in the background).
 */
export function useNow(intervalMs = 30_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = setInterval(tick, intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
