import { StyleSheet, Text, View } from 'react-native';
import { HEADER_HEIGHT } from '../domain/filters';
import { useTheme } from '../theme/useTheme';

export function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.muted }]}>{title.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: HEADER_HEIGHT,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
});
