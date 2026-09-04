import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DatePreset, FilterMode, LaunchStatus, SortKey } from '../domain/types';
import { useAppStore, selectLaunchpads, selectRockets } from '../store/appStore';
import { useTheme } from '../theme/useTheme';
import { Chip } from './Chip';

type Props = {
  visible: boolean;
  onClose: () => void;
  onExport: () => void;
};

const DATE_OPTIONS: { id: DatePreset; label: string }[] = [
  { id: 'last_30_days', label: 'Last 30 days' },
  { id: 'last_year', label: 'Last year' },
  { id: 'all_time', label: 'All time' },
];

const STATUS_OPTIONS: { id: LaunchStatus; label: string }[] = [
  { id: 'success', label: 'Success' },
  { id: 'failure', label: 'Failure' },
  { id: 'upcoming', label: 'Upcoming' },
];

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'date_desc', label: 'Newest' },
  { id: 'date_asc', label: 'Oldest' },
  { id: 'name_asc', label: 'Name A–Z' },
  { id: 'name_desc', label: 'Name Z–A' },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function FilterSheet({ visible, onClose, onExport }: Props) {
  const { colors } = useTheme();
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const resetFilters = useAppStore((s) => s.resetFilters);
  const rockets = useAppStore(selectRockets);
  const pads = useAppStore(selectLaunchpads);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Filters</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close filters">
            <Text style={[styles.link, { color: colors.accent }]}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.section, { color: colors.muted }]}>DATE RANGE</Text>
          <View style={styles.wrap}>
            {DATE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={filters.datePreset === option.id}
                onPress={() => setFilters({ datePreset: option.id })}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>STATUS</Text>
          <View style={styles.wrap}>
            {STATUS_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={filters.statuses.includes(option.id)}
                onPress={() => setFilters({ statuses: toggle(filters.statuses, option.id) })}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>ROCKET</Text>
          <View style={styles.wrap}>
            {rockets.map((rocket) => (
              <Chip
                key={rocket.id}
                label={rocket.name}
                selected={filters.rocketIds.includes(rocket.id)}
                onPress={() => setFilters({ rocketIds: toggle(filters.rocketIds, rocket.id) })}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>LAUNCHPAD</Text>
          <View style={styles.wrap}>
            {pads.map((pad) => (
              <Chip
                key={pad.id}
                label={pad.name}
                selected={filters.launchpadIds.includes(pad.id)}
                onPress={() => setFilters({ launchpadIds: toggle(filters.launchpadIds, pad.id) })}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>SORT</Text>
          <View style={styles.wrap}>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                selected={filters.sort === option.id}
                onPress={() => setFilters({ sort: option.id })}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.muted }]}>COMBINE FACETS</Text>
          <View style={styles.wrap}>
            {(['AND', 'OR'] as FilterMode[]).map((mode) => (
              <Chip
                key={mode}
                label={mode === 'AND' ? 'Match all' : 'Match any'}
                selected={filters.filterMode === mode}
                onPress={() => setFilters({ filterMode: mode })}
              />
            ))}
          </View>
        </ScrollView>
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Pressable onPress={resetFilters} style={[styles.footerBtn, { borderColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.text }]}>Reset</Text>
          </Pressable>
          <Pressable onPress={onExport} style={[styles.footerBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}>
            <Text style={[styles.footerText, { color: '#fff' }]}>Export JSON</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 22, fontWeight: '800' },
  link: { fontSize: 16, fontWeight: '700' },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  section: { marginTop: 16, marginBottom: 8, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  footerBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerText: { fontWeight: '800' },
});
