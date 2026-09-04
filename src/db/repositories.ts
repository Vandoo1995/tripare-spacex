import type { Bookmark, Launch, Launchpad, Payload, Rocket } from '../domain/types';
import { getDb, type BookmarkRow, type LaunchpadRow, type LaunchRow, type PayloadRow, type RocketRow } from './database';

function boolToInt(value: boolean | null): number | null {
  if (value == null) return null;
  return value ? 1 : 0;
}

function intToBool(value: number | null): boolean | null {
  if (value == null) return null;
  return value === 1;
}

function launchFromRow(row: LaunchRow): Launch {
  return {
    id: row.id,
    name: row.name,
    dateUtc: row.date_utc,
    dateUnix: row.date_unix,
    success: intToBool(row.success),
    upcoming: row.upcoming === 1,
    rocketId: row.rocket_id,
    launchpadId: row.launchpad_id,
    details: row.details,
    flightNumber: row.flight_number,
    payloadIds: JSON.parse(row.payload_ids) as string[],
    patchSmall: row.patch_small,
    patchLarge: row.patch_large,
    flickr: JSON.parse(row.flickr_json) as string[],
    webcast: row.webcast,
    youtubeId: row.youtube_id,
    wikipedia: row.wikipedia,
    article: row.article,
    failures: JSON.parse(row.failures_json) as Launch['failures'],
  };
}

function padFromRow(row: LaunchpadRow): Launchpad {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    locality: row.locality,
    region: row.region,
    latitude: row.latitude,
    longitude: row.longitude,
    launchAttempts: row.launch_attempts,
    launchSuccesses: row.launch_successes,
    status: row.status,
    details: row.details,
    imageUrl: row.image_url,
  };
}

export async function replaceCatalog(input: {
  launches: Launch[];
  launchpads: Launchpad[];
  rockets: Rocket[];
  payloads: Payload[];
}): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.execAsync(
      'DELETE FROM launches; DELETE FROM launchpads; DELETE FROM rockets; DELETE FROM payloads;',
    );
    for (const launch of input.launches) {
      await db.runAsync(
        `INSERT INTO launches (
          id, name, date_utc, date_unix, success, upcoming, rocket_id, launchpad_id,
          details, flight_number, payload_ids, patch_small, patch_large, flickr_json,
          webcast, youtube_id, wikipedia, article, failures_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        launch.id,
        launch.name,
        launch.dateUtc,
        launch.dateUnix,
        boolToInt(launch.success),
        launch.upcoming ? 1 : 0,
        launch.rocketId,
        launch.launchpadId,
        launch.details,
        launch.flightNumber,
        JSON.stringify(launch.payloadIds),
        launch.patchSmall,
        launch.patchLarge,
        JSON.stringify(launch.flickr),
        launch.webcast,
        launch.youtubeId,
        launch.wikipedia,
        launch.article,
        JSON.stringify(launch.failures),
      );
    }
    for (const pad of input.launchpads) {
      await db.runAsync(
        `INSERT INTO launchpads (
          id, name, full_name, locality, region, latitude, longitude,
          launch_attempts, launch_successes, status, details, image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        pad.id,
        pad.name,
        pad.fullName,
        pad.locality,
        pad.region,
        pad.latitude,
        pad.longitude,
        pad.launchAttempts,
        pad.launchSuccesses,
        pad.status,
        pad.details,
        pad.imageUrl,
      );
    }
    for (const rocket of input.rockets) {
      await db.runAsync(
        'INSERT INTO rockets (id, name, type) VALUES (?, ?, ?)',
        rocket.id,
        rocket.name,
        rocket.type,
      );
    }
    for (const payload of input.payloads) {
      await db.runAsync(
        'INSERT INTO payloads (id, name, type, mass_kg) VALUES (?, ?, ?, ?)',
        payload.id,
        payload.name,
        payload.type,
        payload.massKg,
      );
    }
  });
}

export async function loadCatalog(): Promise<{
  launches: Launch[];
  launchpads: Launchpad[];
  rockets: Rocket[];
  payloads: Payload[];
}> {
  const db = await getDb();
  const [launchRows, padRows, rocketRows, payloadRows] = await Promise.all([
    db.getAllAsync<LaunchRow>('SELECT * FROM launches'),
    db.getAllAsync<LaunchpadRow>('SELECT * FROM launchpads'),
    db.getAllAsync<RocketRow>('SELECT * FROM rockets'),
    db.getAllAsync<PayloadRow>('SELECT * FROM payloads'),
  ]);
  return {
    launches: launchRows.map(launchFromRow),
    launchpads: padRows.map(padFromRow),
    rockets: rocketRows.map((row) => ({ id: row.id, name: row.name, type: row.type })),
    payloads: payloadRows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      massKg: row.mass_kg,
    })),
  };
}

export async function loadBookmarks(): Promise<BookmarkRow[]> {
  const db = await getDb();
  return db.getAllAsync<BookmarkRow>('SELECT * FROM bookmarks ORDER BY created_at DESC');
}

export async function upsertBookmark(launchId: string, notesCipher: string | null): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO bookmarks (launch_id, notes_cipher, created_at)
     VALUES (?, ?, ?)
     ON CONFLICT(launch_id) DO UPDATE SET notes_cipher = excluded.notes_cipher`,
    launchId,
    notesCipher,
    Date.now(),
  );
}

export async function deleteBookmark(launchId: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM bookmarks WHERE launch_id = ?', launchId);
}

export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM meta WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export function toBookmark(row: BookmarkRow, notes: string): Bookmark {
  return {
    launchId: row.launch_id,
    notes,
    createdAt: row.created_at,
  };
}
