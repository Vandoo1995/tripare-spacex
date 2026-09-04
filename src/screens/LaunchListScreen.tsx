import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  activeFilterCount,
  applyFilters,
  buildGroupedRows,
  offsetsFor,
  stickyHeaderIndices,
  type ListRow,
} from '../domain/filters';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import type { LaunchesStackParamList } from '../navigation/types';
import { exportLaunchesJson } from '../services/export';
import { selectLaunchList, useAppStore } from '../store/appStore';
import { persistTheme, syncNow } from '../sync/syncEngine';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../components/EmptyState';
import { FilterSheet } from '../components/FilterSheet';
import { LaunchRow } from '../components/LaunchRow';
import { SectionHeader } from '../components/SectionHeader';
import { SyncBanner } from '../components/SyncBanner';

export function LaunchListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<LaunchesStackParamList>>();
  const { colors, resolved } = useTheme();
  const ready = useAppStore((s) => s.ready);
  const launchesMap = useAppStore((s) => s.launches);
  const rockets = useAppStore((s) => s.rockets);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const filters = useAppStore((s) => s.filters);
  const setSearch = useAppStore((s) => s.setSearch);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(filters.search);
  const debounced = useDebouncedValue(query, 300);

  useEffect(() => {
    setSearch(debounced);
  }, [debounced, setSearch]);

  const launches = useAppStore(selectLaunchList);
  const filtered = useMemo(() => applyFilters(launches, filters), [launches, filters]);
  const rows = useMemo(() => buildGroupedRows(filtered, filters.sort), [filtered, filters.sort]);
  const sticky = useMemo(() => stickyHeaderIndices(rows), [rows]);
  const offsets = useMemo(() => offsetsFor(rows), [rows]);
  const filterCount = activeFilterCount(filters);

  const onPressLaunch = useCallback(
    (launchId: string) => navigation.navigate('LaunchDetails', { launchId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.type === 'header') return <SectionHeader title={item.title} />;
      const launch = launchesMap[item.launchId];
      if (!launch) return null;
      return (
        <LaunchRow
          launch={launch}
          rocketName={launch.rocketId ? rockets[launch.rocketId]?.name : undefined}
          bookmarked={Boolean(bookmarks[launch.id])}
          onPress={onPressLaunch}
        />
      );
    },
    [bookmarks, launchesMap, onPressLaunch, rockets],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.muted }]}>TRIPARE · SPACEX</Text>
          <Text style={[styles.title, { color: colors.text }]}>Mission Control</Text>
        </View>
        <Pressable
          onPress={() => void persistTheme(resolved === 'dark' ? 'light' : 'dark')}
          accessibilityRole="button"
          accessibilityLabel="Toggle color theme"
          style={[styles.iconBtn, { borderColor: colors.border }]}
        >
          <Ionicons name={resolved === 'dark' ? 'sunny' : 'moon'} size={18} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search mission name"
          placeholderTextColor={colors.muted}
          style={[styles.input, { color: colors.text }]}
          autoCorrect={false}
          accessibilityLabel="Search missions"
        />
        <Pressable
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open filters"
          style={styles.filterBtn}
        >
          <Ionicons name="options" size={18} color={colors.text} />
          {filterCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
              <Text style={styles.badgeText}>{filterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <SyncBanner onRetry={() => void syncNow(true)} />
      <Text style={[styles.count, { color: colors.muted }]}>
        {filtered.length.toLocaleString()} launches
      </Text>

      {!ready ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          stickyHeaderIndices={sticky}
          windowSize={7}
          maxToRenderPerBatch={12}
          initialNumToRender={16}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          getItemLayout={(_, index) => ({
            length: rows[index]?.length ?? 84,
            offset: offsets[index] ?? 0,
            index,
          })}
          refreshControl={
            <RefreshControl
              refreshing={syncStatus === 'syncing'}
              onRefresh={() => void syncNow(true)}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title={Object.keys(launchesMap).length === 0 ? 'No cached launches yet' : 'No matches'}
              body={
                Object.keys(launchesMap).length === 0
                  ? 'Connect to the internet once to download the SpaceX catalog.'
                  : 'Try clearing a filter or search term.'
              }
              actionLabel={filterCount > 0 ? 'Reset filters' : undefined}
              onAction={filterCount > 0 ? () => useAppStore.getState().resetFilters() : undefined}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onExport={() => {
          void exportLaunchesJson(filtered);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 28, fontWeight: '800' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  searchRow: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: { flex: 1, fontSize: 16 },
  filterBtn: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  count: { marginHorizontal: 20, marginBottom: 6, fontSize: 12, fontWeight: '600' },
});
