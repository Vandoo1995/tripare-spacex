import { fetchLaunchpads, fetchLaunches, fetchPayloads, fetchRockets } from '../api/spacex';
import { bundledCatalog } from '../api/seedCatalog';
import {
  deleteBookmark,
  getMeta,
  loadBookmarks,
  loadCatalog,
  replaceCatalog,
  setMeta,
  toBookmark,
  upsertBookmark,
} from '../db/repositories';
import { decryptNote, encryptNote } from '../domain/notesCrypto';
import type { Bookmark, Launch, Launchpad, Payload, Rocket } from '../domain/types';
import { logError, logInfo, logWarn, toUserMessage } from '../logging/logger';
import { readNetwork, subscribeNetwork } from '../services/netinfo';
import { getOrCreateNotesKey } from '../services/secureKey';
import { useAppStore } from '../store/appStore';

let notesKey: string | null = null;
let syncing = false;
let networkUnsub: (() => void) | null = null;

async function notesKeyOrThrow(): Promise<string> {
  if (!notesKey) notesKey = await getOrCreateNotesKey();
  return notesKey;
}

async function decryptBookmarks() {
  const key = await notesKeyOrThrow();
  const rows = await loadBookmarks();
  const bookmarks: Bookmark[] = [];
  for (const row of rows) {
    let notes = '';
    if (row.notes_cipher) {
      try {
        notes = decryptNote(row.notes_cipher, key);
      } catch (error) {
        logWarn('bookmarks', 'Failed to decrypt a note', { launchId: row.launch_id });
        notes = '';
      }
    }
    bookmarks.push(toBookmark(row, notes));
  }
  return bookmarks;
}

export async function toggleBookmark(launchId: string): Promise<void> {
  const existing = useAppStore.getState().bookmarks[launchId];
  if (existing) {
    await deleteBookmark(launchId);
    useAppStore.getState().removeBookmark(launchId);
    return;
  }
  await upsertBookmark(launchId, null);
  useAppStore.getState().upsertBookmark({
    launchId,
    notes: '',
    createdAt: Date.now(),
  });
}

export async function saveBookmarkNotes(launchId: string, notes: string): Promise<void> {
  const key = await notesKeyOrThrow();
  const cipher = notes.trim().length > 0 ? encryptNote(notes, key) : null;
  const existing = useAppStore.getState().bookmarks[launchId];
  await upsertBookmark(launchId, cipher);
  useAppStore.getState().upsertBookmark({
    launchId,
    notes,
    createdAt: existing?.createdAt ?? Date.now(),
  });
}

async function settled<T>(promise: Promise<T>, label: string): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    logWarn('sync', `${label} failed`, { error: toUserMessage(error) });
    return null;
  }
}

export async function syncNow(force = false): Promise<void> {
  if (syncing) return;
  const online = await readNetwork();
  useAppStore.getState().setOnline(online);
  if (!online) {
    useAppStore.getState().setSyncResult({
      ok: false,
      error: 'You are offline. Showing cached launches.',
    });
    return;
  }

  syncing = true;
  useAppStore.getState().setSyncing();
  try {
    const [launches, launchpads, rockets, payloads] = await Promise.all([
      fetchLaunches(),
      settled(fetchLaunchpads(), 'launchpads'),
      settled(fetchRockets(), 'rockets'),
      settled(fetchPayloads(), 'payloads'),
    ]);

    const current = useAppStore.getState();
    const nextPads: Launchpad[] = launchpads ?? Object.values(current.launchpads);
    const nextRockets: Rocket[] = rockets ?? Object.values(current.rockets);
    const nextPayloads: Payload[] = payloads ?? Object.values(current.payloads);
    const nextLaunches: Launch[] = launches;

    await replaceCatalog({
      launches: nextLaunches,
      launchpads: nextPads,
      rockets: nextRockets,
      payloads: nextPayloads,
    });
    const lastSyncedAt = Date.now();
    await setMeta('lastSyncedAt', String(lastSyncedAt));

    const bookmarks = await decryptBookmarks();
    useAppStore.getState().hydrate({
      launches: nextLaunches,
      launchpads: nextPads,
      rockets: nextRockets,
      payloads: nextPayloads,
      bookmarks,
      lastSyncedAt,
      themeMode: current.themeMode,
    });

    const partial =
      !launchpads || !rockets || !payloads
        ? 'Synced launches. Some enrichment data could not be refreshed.'
        : null;
    useAppStore.getState().setSyncResult({
      ok: true,
      error: partial,
      lastSyncedAt,
    });
    logInfo('sync', `Synced ${nextLaunches.length} launches`, { force });
  } catch (error) {
    logWarn('sync', toUserMessage(error));
    const current = useAppStore.getState();
    const hasCache = current.launchList.length > 0;
    if (!hasCache) {
      const seed = bundledCatalog();
      await replaceCatalog(seed);
      const bookmarks = await decryptBookmarks();
      current.hydrate({
        ...seed,
        bookmarks,
        lastSyncedAt: null,
        themeMode: current.themeMode,
      });
      useAppStore.getState().setSyncResult({
        ok: true,
        error: toUserMessage(error),
      });
      logInfo('sync', `Loaded bundled catalog (${seed.launches.length} launches)`);
      return;
    }
    useAppStore.getState().setSyncResult({
      ok: false,
      error: `${toUserMessage(error)} Cached data is still available.`,
    });
  } finally {
    syncing = false;
  }
}

export async function persistTheme(mode: 'system' | 'light' | 'dark'): Promise<void> {
  useAppStore.getState().setThemeMode(mode);
  await setMeta('themeMode', mode);
}

export async function bootstrap(): Promise<void> {
  try {
    await notesKeyOrThrow();
    const catalog = await loadCatalog();
    const bookmarks = await decryptBookmarks();
    const lastSyncedRaw = await getMeta('lastSyncedAt');
    const themeModeRaw = await getMeta('themeMode');
    const lastSyncedAt = lastSyncedRaw ? Number(lastSyncedRaw) : null;
    useAppStore.getState().hydrate({
      launches: catalog.launches,
      launchpads: catalog.launchpads,
      rockets: catalog.rockets,
      payloads: catalog.payloads,
      bookmarks,
      lastSyncedAt: Number.isFinite(lastSyncedAt) ? lastSyncedAt : null,
      themeMode:
        themeModeRaw === 'light' || themeModeRaw === 'dark' || themeModeRaw === 'system'
          ? themeModeRaw
          : 'system',
    });
  } catch (error) {
    logError('bootstrap', error);
  } finally {
    useAppStore.getState().setReady(true);
  }

  if (!networkUnsub) {
    networkUnsub = subscribeNetwork((online) => {
      const wasOffline = !useAppStore.getState().isOnline;
      useAppStore.getState().setOnline(online);
      if (online && wasOffline) {
        void syncNow();
      }
    });
  }

  await syncNow();
}
