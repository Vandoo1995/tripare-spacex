import { LogBox } from 'react-native';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation/RootNavigator';
import { startImageCacheGuard } from './src/services/imageCache';
import { bootstrap } from './src/sync/syncEngine';
import { useTheme } from './src/theme/useTheme';

LogBox.ignoreLogs(['Request failed (525)', '[sync]']);

export default function App() {
  const { isDark } = useTheme();

  useEffect(() => {
    const stopCacheGuard = startImageCacheGuard();
    void bootstrap();
    return () => stopCacheGuard();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary label="root">
          <RootNavigator />
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
