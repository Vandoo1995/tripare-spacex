import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

type Props = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, actionLabel, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.box}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={[styles.btn, { borderColor: colors.border }]}>
          <Text style={[styles.btnText, { color: colors.accent }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', padding: 32, gap: 8 },
  title: { fontSize: 18, fontWeight: '800' },
  body: { textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { fontWeight: '700' },
});
