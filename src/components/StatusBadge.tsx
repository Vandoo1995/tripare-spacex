import { StyleSheet, Text, View } from 'react-native';
import type { LaunchStatus } from '../domain/types';
import { useTheme } from '../theme/useTheme';

export function StatusBadge({ status }: { status: LaunchStatus }) {
  const { colors } = useTheme();
  const map = {
    success: { bg: `${colors.success}22`, fg: colors.success, label: 'SUCCESS' },
    failure: { bg: `${colors.danger}22`, fg: colors.danger, label: 'FAILURE' },
    upcoming: { bg: `${colors.upcoming}22`, fg: colors.upcoming, label: 'UPCOMING' },
  }[status];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.text, { color: map.fg }]}>{map.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
});
