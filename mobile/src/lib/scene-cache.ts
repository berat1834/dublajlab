import * as SQLite from 'expo-sqlite';

import type { VideoTemplate } from '@/types';

const DATABASE_NAME = 'dublajlab-mobile.db';
const CACHE_ROW_ID = 1;

let databasePromise: ReturnType<typeof SQLite.openDatabaseAsync> | null = null;

async function database() {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  const db = await databasePromise;
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS scene_cache (
      id INTEGER PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      cached_at TEXT NOT NULL
    );
  `);
  return db;
}

/** Stores the latest valid scene response for fast startup and offline fallback. */
export async function cacheScenes(scenes: VideoTemplate[]) {
  const db = await database();
  await db.runAsync(
    `INSERT INTO scene_cache (id, payload, cached_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       payload = excluded.payload,
       cached_at = excluded.cached_at`,
    CACHE_ROW_ID,
    JSON.stringify(scenes),
    new Date().toISOString(),
  );
}

export async function readCachedScenes(): Promise<VideoTemplate[]> {
  const db = await database();
  const row = await db.getFirstAsync<{ payload: string }>(
    'SELECT payload FROM scene_cache WHERE id = ?',
    CACHE_ROW_ID,
  );
  if (!row) return [];

  try {
    const parsed = JSON.parse(row.payload) as unknown;
    return Array.isArray(parsed) ? (parsed as VideoTemplate[]) : [];
  } catch {
    // A damaged cache must never prevent the remote catalog from opening.
    await db.runAsync('DELETE FROM scene_cache WHERE id = ?', CACHE_ROW_ID);
    return [];
  }
}
