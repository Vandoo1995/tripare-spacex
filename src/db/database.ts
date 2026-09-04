import * as SQLite from 'expo-sqlite';

const DB_NAME = 'tripare-spacex.db';
const SCHEMA_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA_V1 = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS launches (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  date_utc TEXT NOT NULL,
  date_unix INTEGER NOT NULL,
  success INTEGER,
  upcoming INTEGER NOT NULL,
  rocket_id TEXT,
  launchpad_id TEXT,
  details TEXT,
  flight_number INTEGER NOT NULL,
  payload_ids TEXT NOT NULL,
  patch_small TEXT,
  patch_large TEXT,
  flickr_json TEXT NOT NULL,
  webcast TEXT,
  youtube_id TEXT,
  wikipedia TEXT,
  article TEXT,
  failures_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS launchpads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  locality TEXT,
  region TEXT,
  latitude REAL,
  longitude REAL,
  launch_attempts INTEGER NOT NULL,
  launch_successes INTEGER NOT NULL,
  status TEXT,
  details TEXT,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS rockets (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT
);

CREATE TABLE IF NOT EXISTS payloads (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  mass_kg REAL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  launch_id TEXT PRIMARY KEY NOT NULL,
  notes_cipher TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_launches_date ON launches(date_unix DESC);
CREATE INDEX IF NOT EXISTS idx_launches_name ON launches(name);
CREATE INDEX IF NOT EXISTS idx_launches_rocket ON launches(rocket_id);
CREATE INDEX IF NOT EXISTS idx_launches_pad ON launches(launchpad_id);
`;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
}

export async function resetDbForTests(): Promise<void> {
  dbPromise = null;
}

export type LaunchRow = {
  id: string;
  name: string;
  date_utc: string;
  date_unix: number;
  success: number | null;
  upcoming: number;
  rocket_id: string | null;
  launchpad_id: string | null;
  details: string | null;
  flight_number: number;
  payload_ids: string;
  patch_small: string | null;
  patch_large: string | null;
  flickr_json: string;
  webcast: string | null;
  youtube_id: string | null;
  wikipedia: string | null;
  article: string | null;
  failures_json: string;
};

export type LaunchpadRow = {
  id: string;
  name: string;
  full_name: string;
  locality: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  launch_attempts: number;
  launch_successes: number;
  status: string | null;
  details: string | null;
  image_url: string | null;
};

export type RocketRow = {
  id: string;
  name: string;
  type: string | null;
};

export type PayloadRow = {
  id: string;
  name: string;
  type: string | null;
  mass_kg: number | null;
};

export type BookmarkRow = {
  launch_id: string;
  notes_cipher: string | null;
  created_at: number;
};

export type MetaRow = {
  key: string;
  value: string;
};
