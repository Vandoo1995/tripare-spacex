import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { Launch } from '../domain/types';
import { statusOf } from '../domain/filters';
import { formatLaunchDate } from '../domain/format';
import { imageCachePolicy } from '../services/imageCache';
import { useTheme } from '../theme/useTheme';
import { StatusBadge } from './StatusBadge';
import { ROW_HEIGHT } from '../domain/filters';

type Props = {
  launch: Launch;
  rocketName?: string;
  bookmarked: boolean;
  onPress: (launchId: string) => void;
};

function LaunchRowInner({ launch, rocketName, bookmarked, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(launch.id)}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="button"
      accessibilityLabel={`${launch.name}, ${statusOf(launch)}, ${formatLaunchDate(launch.dateUtc)}`}
    >
      <Image
        source={launch.patchSmall ? { uri: launch.patchSmall } : undefined}
        style={[styles.patch, { backgroundColor: colors.surface }]}
        cachePolicy={imageCachePolicy}
        recyclingKey={launch.id}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {launch.name}
          </Text>
          {bookmarked ? (
            <Ionicons name="bookmark" size={16} color={colors.accent} accessibilityLabel="Bookmarked" />
          ) : null}
        </View>
        <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
          {formatLaunchDate(launch.dateUtc)}
          {rocketName ? ` · ${rocketName}` : ''}
        </Text>
      </View>
      <StatusBadge status={statusOf(launch)} />
    </Pressable>
  );
}

export const LaunchRow = memo(LaunchRowInner);

const styles = StyleSheet.create({
  row: {
    height: ROW_HEIGHT - 8,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patch: { width: 44, height: 44, borderRadius: 8 },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
});
