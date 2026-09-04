import { Pressable, StyleSheet, Text, View } from 'react-native';
import { lastSyncedLabel } from '../domain/format';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/useTheme';

type Props = {
  onRetry?: () => void;
};

export function SyncBanner({ onRetry }: Props) {
  const { colors } = useTheme();
  const isOnline = useAppStore((s) => s.isOnline);
  const syncStatus = useAppStore((s) => s.syncStatus);
  const syncError = useAppStore((s) => s.syncError);
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);

  const tone = !isOnline || syncStatus === 'error' ? colors.danger : colors.muted;
  const bg = !isOnline || syncStatus === 'error' ? `${colors.danger}22` : colors.surface;
  const label = !isOnline
    ? `Offline · ${lastSyncedLabel(lastSyncedAt)}`
    : syncStatus === 'syncing'
      ? 'Syncing latest launches…'
      : syncError
        ? syncError
        : lastSyncedLabel(lastSyncedAt);

  return (
    <View
      style={[styles.row, { backgroundColor: bg, borderColor: colors.border }]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
        {label}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel="Refresh data">
          <Text style={[styles.retry, { color: colors.accent }]}>Refresh</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  text: { flex: 1, fontSize: 12, fontWeight: '600' },
  retry: { fontSize: 12, fontWeight: '800' },
});
