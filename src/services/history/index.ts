import { createHistory } from './history';
import { sqliteStorage } from './sqlite-storage';
import { useHistoryOf } from './use-history';

/** History persisted in `video.db`. The database opens on the first call, not on import. */
const history = createHistory(sqliteStorage());

export const recordStart = history.recordStart;
export const savePosition = history.savePosition;
export const resumeAt = history.resumeAt;
export const list = history.list;
export const remove = history.remove;
export const clear = history.clear;

/** `{ entries, remove, clear, refresh }`, re-read whenever the screen regains focus. */
export const useHistory = () => useHistoryOf(history);

export { MIN_RESUME_SECONDS, WATCHED_FRACTION } from './rules';
export type { HistoryEntry, HistoryVideo } from './types';
