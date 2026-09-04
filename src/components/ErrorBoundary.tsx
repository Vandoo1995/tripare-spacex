import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { logError } from '../logging/logger';
import { useTheme } from '../theme/useTheme';

type Props = {
  children: React.ReactNode;
  label?: string;
};

type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    logError(this.props.label ?? 'ui', error);
  }

  render() {
    if (this.state.error) {
      return (
        <Fallback
          message={this.state.error.message}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}

function Fallback({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>This section hit an error</Text>
      <Text style={[styles.body, { color: colors.muted }]}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={[styles.btn, { backgroundColor: colors.accent }]}
        accessibilityRole="button"
        accessibilityLabel="Retry this section"
      >
        <Text style={styles.btnText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  body: { textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 8, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  btnText: { color: '#fff', fontWeight: '700' },
});
