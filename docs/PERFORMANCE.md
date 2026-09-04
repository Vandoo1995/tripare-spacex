# Performance

Budget from the brief: <3s to interactive with cache, 60fps list scroll, <150MB memory, documented bundle.

## List (1,000+ rows)

| Technique | Why |
| --- | --- |
| Mixed `FlatList` + sticky headers | Spec asks for year/month grouping |
| Fixed `HEADER_HEIGHT=40`, `ROW_HEIGHT=84` | Enables `getItemLayout` (no async measure) |
| `windowSize={7}`, `maxToRenderPerBatch={12}` | Caps mounted cells |
| `removeClippedSubviews` | Unmounts offscreen native views |
| `memo(LaunchRow)` + stable `onPress` | Stops row churn during scroll |
| `expo-image` `memory-disk` + recyclingKey | Mission patches do not refetch |
| Clear memory cache on background | Keeps RSS from creeping |

How to capture a profiler screenshot:

1. `npm run ios`
2. In React Native DevTools → Profiler, record a scroll through the list.
3. Confirm commit durations stay near the 16ms frame budget after the first paint.

How to capture memory:

1. Xcode → Debug navigator → Memory, or Android Studio profiler.
2. Scroll the full list twice.
3. Expected: well under 150MB for JS + images with disk cache; patches are small PNGs.

## Filter / group CPU

`applyFilters` + `buildGroupedRows` are O(n log n) from the sort. A Jest assertion builds 1,200 launches and filters them in <50ms on a laptop CPU. That work runs in `useMemo` keyed on filter identity, not per frame.

## Maps

15 pads, clustered. No 1,000 markers. Region-complete (not region-change) updates clustering so pan stays smooth.

## Bundle

Measure:

```bash
npx expo export --platform ios
# then inspect dist/ with `npx source-map-explorer` if sourcemaps are enabled
```

Expected order of magnitude for this app (JS Hermes bytecode, not node_modules on disk):

| Chunk | Approx |
| --- | --- |
| React + RN + Navigation + Gesture Handler | largest vendor slice |
| App source (`src/**`) | small; domain is a few KB |
| crypto-js | non-trivial; accepted to avoid a native AES module |
| react-native-maps | native, not in JS bundle size the same way |

`node_modules` on disk is much larger than the shipped JS. Justify keeping crypto-js: one AES implementation shared by tests and runtime, no extra native dependency for the assignment.

## Initial load

With a warm SQLite file, bootstrap is: open DB → four SELECTs → decrypt a handful of notes → `hydrate`. That is disk-bound and should be well under 3s. The network sync is explicitly *after* first paint.

## Image cache limit

expo-image uses an LRU disk cache. We additionally drop the in-memory image cache when the app backgrounds so mission-patch bitmaps do not sit in RAM overnight.
