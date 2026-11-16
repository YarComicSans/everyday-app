import { videoDatabase } from './database';
import type { HistoryEntry, HistoryStorage } from './types';

type Row = {
  video_id: string;
  title: string;
  channel: string;
  duration_seconds: number;
  thumbnail_url: string;
  last_watched_at: number;
  resume_position: number;
  watched: number;
};

const toEntry = (row: Row): HistoryEntry => ({
  videoId: row.video_id,
  title: row.title,
  channel: row.channel,
  durationSeconds: row.duration_seconds,
  thumbnailUrl: row.thumbnail_url,
  lastWatchedAt: row.last_watched_at,
  resumePosition: row.resume_position,
  watched: row.watched !== 0,
});

/** `HistoryStorage` in the `history` table of `video.db`. Stores metadata only. */
export function sqliteStorage(): HistoryStorage {
  return {
    get(videoId) {
      const row = videoDatabase().getFirstSync<Row>('SELECT * FROM history WHERE video_id = ?', videoId);
      return row ? toEntry(row) : null;
    },
    put(e) {
      videoDatabase().runSync(
        `INSERT OR REPLACE INTO history
           (video_id, title, channel, duration_seconds, thumbnail_url, last_watched_at, resume_position, watched)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        e.videoId,
        e.title,
        e.channel,
        e.durationSeconds,
        e.thumbnailUrl,
        e.lastWatchedAt,
        e.resumePosition,
        e.watched ? 1 : 0,
      );
    },
    all() {
      return videoDatabase()
        .getAllSync<Row>('SELECT * FROM history ORDER BY last_watched_at DESC')
        .map(toEntry);
    },
    remove(videoId) {
      videoDatabase().runSync('DELETE FROM history WHERE video_id = ?', videoId);
    },
    clear() {
      videoDatabase().runSync('DELETE FROM history');
    },
  };
}
