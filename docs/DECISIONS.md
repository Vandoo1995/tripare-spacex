# Technical decisions

## State management — Zustand

Chosen over Redux Toolkit and Context+Reducer.

- The catalog is large but simple (normalized records + a few UI flags). Redux slices/actions would add boilerplate without extra correctness.
- Context would rerender every consumer on each filter keystroke. Zustand selectors keep the list, map, and theme isolated.
- Jotai atoms would split a catalog that we always hydrate/replace as a unit.

The store is *not* persisted as JSON. SQLite is the durable cache; Zustand is the reactive projection.

## Database — expo-sqlite

Chosen over AsyncStorage and WatermelonDB.

- AsyncStorage would serialize 1,000 launches as one blob (slow parse, no indexes, painful migrations).
- WatermelonDB shines when many collections sync bidirectionally. This app is read-mostly from a public API plus a tiny bookmarks table.
- SQLite gives WAL, indexed date/name filters, transactional replace, and `user_version` migrations.

## API cache — custom client, not React Query

React Query is excellent when the network cache *is* the cache. Here the product requirement is “works fully offline after the first fetch,” which means SQLite must outlive the JS heap. Running React Query *and* SQLite would duplicate 1,000 records in memory.

The custom client still implements the brief’s HTTP requirements: retry with exponential backoff, request dedupe, and timeout.

## Offline strategy

1. Always render SQLite data first.
2. Sync in the background when NetInfo says online.
3. On failure, keep cache and show a banner (`Last synced …` / error).
4. On reconnect, sync again without user action.
5. Pull-to-refresh forces a sync.

Launches are required for a successful sync. Launchpads, rockets, and payloads use `allSettled` so a single enrichment outage is not fatal.

## Map clustering

Library clustering (e.g. `react-native-map-clustering`) pulls extra native surface area. With ~15 pads, a 30-line greedy haversine clusterer is enough, fully unit-tested, and independent of MapView. Radius grows with `latitudeDelta` so Florida pads merge when zoomed out and split when zoomed in.

## Filters

- Search is a query, always AND-ed.
- Date / status / rocket / pad are facets. Empty facet = no constraint. Within a facet, selection is OR. Across facets, AND or OR is user-toggleable (bonus).
- Date grouping is used for date sorts; first-letter grouping is used for name sorts so sticky headers still make sense.

## Encryption

Notes are private and local. AES with a SecureStore-backed key is enough; there is no account server to do envelope encryption. crypto-js was used because it runs the same in Jest and React Native without extra native AES modules.

## Navigation

React Navigation (typed stacks + tabs) instead of Expo Router. The information architecture is three roots plus a shared details screen, which maps cleanly to explicit navigators and `ParamList` types.

## Expo vs bare RN

Expo SDK 57 was chosen so a reviewer can `npm i && npm run ios` without Xcode project archaeology. Native modules used (`sqlite`, `secure-store`, `location`, `maps`) are all first-party or Expo-compatible.
