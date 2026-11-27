/** The single record of one Video in History: only what is needed to list and resume it. */
export type HistoryEntry = {
  videoId: string;
  title: string;
  channel: string;
  durationSeconds: number;
  thumbnailUrl: string;
  /** Epoch ms of the last time playback started; History is sorted by this, newest first. */
  lastWatchedAt: number;
  /** Saved playback position in seconds. */
  resumePosition: number;
  watched: boolean;
};

/** What `recordStart` needs to know about a Video. `VideoSummary` fits structurally. */
export type HistoryVideo = {
  id: string;
  title: string;
  channel: string;
  durationSeconds: number;
  thumbnailUrl: string;
};

/** Where History Entries are kept. SQLite in the app, an in-memory map in tests. */
export type HistoryStorage = {
  get(videoId: string): HistoryEntry | null;
  put(entry: HistoryEntry): void;
  all(): HistoryEntry[];
  remove(videoId: string): void;
  clear(): void;
};
