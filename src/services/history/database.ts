import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'video.db';

/** Bump and add a step to `MIGRATIONS` to change the schema; each step runs once, in order. */
const MIGRATIONS: readonly string[] = [
  `CREATE TABLE history (
     video_id TEXT PRIMARY KEY NOT NULL,
     title TEXT NOT NULL,
     channel TEXT NOT NULL,
     duration_seconds REAL NOT NULL,
     thumbnail_url TEXT NOT NULL,
     last_watched_at INTEGER NOT NULL,
     resume_position REAL NOT NULL,
     watched INTEGER NOT NULL
   );
   CREATE INDEX history_last_watched_at ON history (last_watched_at DESC);`,
];

let database: SQLiteDatabase | null = null;

/** The Video Section's database, opened and migrated on first use (no `SQLiteProvider`). */
export function videoDatabase(): SQLiteDatabase {
  if (database) return database;
  const db = openDatabaseSync(DATABASE_NAME);
  migrate(db);
  return (database = db);
}

function migrate(db: SQLiteDatabase) {
  const current = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  if (current >= MIGRATIONS.length) return;
  db.withTransactionSync(() => {
    for (const step of MIGRATIONS.slice(current)) db.execSync(step);
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });
}
