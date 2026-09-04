import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BookmarksStackParamList } from '../navigation/types';
import { useAppStore } from '../store/appStore';
import { useTheme } from '../theme/useTheme';
import { EmptyState } from '../components/EmptyState';
import { LaunchRow } from '../components/LaunchRow';

export function BookmarksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BookmarksStackParamList>>();
  const { colors } = useTheme();
  const bookmarks = useAppStore((s) => s.bookmarks);
  const launches = useAppStore((s) => s.launches);
  const rockets = useAppStore((s) => s.rockets);

  const items = useMemo(() => {
    return Object.values(bookmarks)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((bookmark) => launches[bookmark.launchId])
      .filter((launch): launch is NonNullable<typeof launch> => Boolean(launch));
  }, [bookmarks, launches]);

  const onPress = useCallback(
    (launchId: string) => navigation.navigate('LaunchDetails', { launchId }),
    [navigation],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.muted }]}>LOCAL</Text>
        <Text style={[styles.title, { color: colors.text }]}>Bookmarks</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <LaunchRow
              launch={item}
              rocketName={item.rocketId ? rockets[item.rocketId]?.name : undefined}
              bookmarked
              onPress={onPress}
            />
            {bookmarks[item.id]?.notes ? (
              <Text style={[styles.note, { color: colors.muted }]} numberOfLines={2}>
                {bookmarks[item.id]?.notes}
              </Text>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No bookmarks yet"
            body="Open a launch and tap Bookmark. Notes are encrypted on device."
          />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 28, fontWeight: '800' },
  note: { marginHorizontal: 28, marginBottom: 10, fontSize: 12 },
});
