import { create } from 'zustand';
import type {
  Bookmark,
  Launch,
  LaunchFilters,
  Launchpad,
  Payload,
  Rocket,
  SyncStatus,
} from '../domain/types';
import { DEFAULT_FILTERS } from '../domain/filters';

export type ThemeMode = 'system' | 'light' | 'dark';

type CatalogMaps = {
  launches: Record<string, Launch>;
  launchpads: Record<string, Launchpad>;
  rockets: Record<string, Rocket>;
  payloads: Record<string, Payload>;
  bookmarks: Record<string, Bookmark>;
};

type AppState = CatalogMaps & {
  ready: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  syncError: string | null;
  lastSyncedAt: number | null;
  themeMode: ThemeMode;
  filters: LaunchFilters;
  launchList: Launch[];
  launchpadList: Launchpad[];
  rocketList: Rocket[];
  hydrate: (input: {
    launches: Launch[];
    launchpads: Launchpad[];
    rockets: Rocket[];
    payloads: Payload[];
    bookmarks: Bookmark[];
    lastSyncedAt: number | null;
    themeMode?: ThemeMode;
  }) => void;
  setReady: (ready: boolean) => void;
  setOnline: (online: boolean) => void;
  setSyncing: () => void;
  setSyncResult: (input: { ok: boolean; error?: string | null; lastSyncedAt?: number | null }) => void;
  setSearch: (search: string) => void;
  setFilters: (patch: Partial<LaunchFilters>) => void;
  resetFilters: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  upsertBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (launchId: string) => void;
};

function indexById<T extends { id: string }>(items: T[]): Record<string, T> {
  const map: Record<string, T> = {};
  for (const item of items) map[item.id] = item;
  return map;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  isOnline: true,
  syncStatus: 'idle',
  syncError: null,
  lastSyncedAt: null,
  themeMode: 'system',
  filters: DEFAULT_FILTERS,
  launches: {},
  launchpads: {},
  rockets: {},
  payloads: {},
  bookmarks: {},
  launchList: [],
  launchpadList: [],
  rocketList: [],
  hydrate: ({ launches, launchpads, rockets, payloads, bookmarks, lastSyncedAt, themeMode }) => {
    const bookmarkMap: Record<string, Bookmark> = {};
    for (const bookmark of bookmarks) bookmarkMap[bookmark.launchId] = bookmark;
    set({
      launches: indexById(launches),
      launchpads: indexById(launchpads),
      rockets: indexById(rockets),
      payloads: indexById(payloads),
      bookmarks: bookmarkMap,
      launchList: launches,
      launchpadList: [...launchpads].sort((a, b) => a.name.localeCompare(b.name)),
      rocketList: [...rockets].sort((a, b) => a.name.localeCompare(b.name)),
      lastSyncedAt,
      themeMode: themeMode ?? 'system',
    });
  },
  setReady: (ready) => set({ ready }),
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: () => set({ syncStatus: 'syncing', syncError: null }),
  setSyncResult: ({ ok, error, lastSyncedAt }) =>
    set((state) => ({
      syncStatus: ok ? 'success' : 'error',
      syncError: ok ? null : (error ?? 'Sync failed'),
      lastSyncedAt: lastSyncedAt ?? state.lastSyncedAt,
    })),
  setSearch: (search) => set((state) => ({ filters: { ...state.filters, search } })),
  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set((state) => ({ filters: { ...DEFAULT_FILTERS, search: state.filters.search } })),
  setThemeMode: (themeMode) => set({ themeMode }),
  upsertBookmark: (bookmark) =>
    set((state) => ({ bookmarks: { ...state.bookmarks, [bookmark.launchId]: bookmark } })),
  removeBookmark: (launchId) =>
    set((state) => {
      const next = { ...state.bookmarks };
      delete next[launchId];
      return { bookmarks: next };
    }),
}));

export function selectLaunchList(state: AppState): Launch[] {
  return state.launchList;
}

export function selectRockets(state: AppState): Rocket[] {
  return state.rocketList;
}

export function selectLaunchpads(state: AppState): Launchpad[] {
  return state.launchpadList;
}

export type { SortKey, FilterMode } from '../domain/types';
