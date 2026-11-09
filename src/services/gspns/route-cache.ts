import { File, Paths } from 'expo-file-system';

import type { MapLine, Route } from './types';

/**
 * Network-map data for one timetable version. Lives in the app's cache directory:
 * removed with the app, skipped by Android backup, and refetched if the OS clears it.
 */
export type RouteCache = {
  /** Timetable version (`vaziod`) the data was fetched for; anything else is discarded. */
  validFrom: string;
  mapLines?: MapLine[];
  /** Ordered routes by map line id. */
  routes: Record<number, Route>;
};

const FILE_NAME = 'gspns-routes.json';

let memory: RouteCache | null = null;

const cacheFile = () => {
  try {
    return new File(Paths.cache, FILE_NAME);
  } catch {
    return null; // no file system (web)
  }
};

export async function readRouteCache(validFrom: string): Promise<RouteCache> {
  if (memory?.validFrom === validFrom) return memory;
  try {
    const file = cacheFile();
    if (file?.exists) {
      const stored = JSON.parse(await file.text()) as RouteCache;
      if (stored.validFrom === validFrom && stored.routes) return (memory = stored);
    }
  } catch {
    // Unreadable cache is the same as no cache.
  }
  return (memory = { validFrom, routes: {} });
}

export async function writeRouteCache(cache: RouteCache): Promise<void> {
  memory = cache;
  try {
    const file = cacheFile();
    if (!file) return;
    if (!file.exists) file.create({ intermediates: true });
    await file.write(JSON.stringify(cache));
  } catch {
    // Keep the in-memory copy; the data is refetched next launch.
  }
}
