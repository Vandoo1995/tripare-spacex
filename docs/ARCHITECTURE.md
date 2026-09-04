# Architecture

## Goals

Keep the UI interactive in under 3 seconds with cached data, stay correct with 1,000+ launches, and survive flaky networks.

## Layers

1. **API client** (`src/api/client.ts`) — `fetch` + `AbortController` timeout, exponential backoff, in-flight promise map for dedupe.
2. **Validation** (`src/api/schemas.ts`) — Zod schemas for SpaceX v5 launches and v4 launchpads/rockets/payloads. Invalid rows are skipped so one bad document cannot blank the catalog.
3. **Persistence** (`src/db`) — SQLite WAL. Tables: `launches`, `launchpads`, `rockets`, `payloads`, `bookmarks`, `meta`. Schema version via `PRAGMA user_version`.
4. **Sync engine** (`src/sync/syncEngine.ts`) — bootstrap loads disk → Zustand; then network sync. NetInfo reconnect triggers another sync. Partial enrichment failures keep launches and show a banner.
5. **State** (`src/store/appStore.ts`) — normalized maps plus filter/search/theme. Screens subscribe to slices only.
6. **Domain** (`src/domain`) — pure functions for filters, grouping, clustering, geo, crypto, formatting. These are the unit-tested core.
7. **UI** — React Navigation tabs (Launches, Map, Bookmarks) with typed native stacks. Error boundaries wrap each tab.

## Data flow

```
Cold start
  open SQLite
  SELECT catalog + bookmarks
  decrypt notes with SecureStore key
  hydrate Zustand  → first paint
  if online: GET /v5/launches + /v4/launchpads + /v4/rockets + /v4/payloads
  Zod parse → REPLACE INTO (transaction)
  update meta.lastSyncedAt
  hydrate Zustand  → refresh UI

Reconnect
  same sync path; UI never waits on network for cached rows
```

## Launchpads enrichment

The brief mentions `GET /v4/launchpads/:id`. Fetching every pad by id would be N+1. The app loads `GET /v4/launchpads` once (same resource, collection form) and still exposes `fetchLaunchpadById` if a pad is missing at detail time.

## List virtualization

Rows are a mixed array of sticky month/letter headers (40px) and launch rows (84px). `getItemLayout` uses precomputed offsets so React Native does not measure 1,000 cells. `LaunchRow` is `memo`’d; the press handler is `useCallback`’d.

## Maps

Two modes share the same filter set:

- **Single pad** on the details Launchpad tab, with optional user location + haversine distance + native directions.
- **Density map** on the Map tab. Marker color encodes filtered launch count; nearby pads cluster as zoom decreases.

Location permission is *when-in-use* only. Denial hides the user dot and distance; pad markers stay.

## Security for notes

`getOrCreateNotesKey` stores a 32-byte key in SecureStore. `encryptNote` / `decryptNote` are pure AES helpers. SQLite stores ciphertext only. Web falls back to an in-memory key because SecureStore is unavailable.

## Error handling

- HTTP and sync errors go through `src/logging/logger.ts` (console today; swap for Sentry).
- User-facing copy is generated with `toUserMessage`.
- `ErrorBoundary` wraps root + each tab so a map failure cannot kill the list.
