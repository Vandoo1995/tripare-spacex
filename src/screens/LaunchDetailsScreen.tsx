import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LaunchesStackParamList } from '../navigation/types';
import { statusOf } from '../domain/filters';
import { formatLaunchDate } from '../domain/format';
import { formatDistance, haversineKm, readCoord } from '../domain/geo';
import { openDirections, openExternal } from '../services/directions';
import { requestUserLocation } from '../services/location';
import { imageCachePolicy } from '../services/imageCache';
import { useAppStore } from '../store/appStore';
import { saveBookmarkNotes, toggleBookmark } from '../sync/syncEngine';
import { useTheme } from '../theme/useTheme';
import { StatusBadge } from '../components/StatusBadge';
import { PadMap } from '../components/PadMap';

type Tab = 'overview' | 'launchpad' | 'media';
type Props = NativeStackScreenProps<LaunchesStackParamList, 'LaunchDetails'>;

export function LaunchDetailsScreen({ route }: Props) {
  const { launchId } = route.params;
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const launch = useAppStore((s) => s.launches[launchId]);
  const pad = useAppStore((s) => (launch?.launchpadId ? s.launchpads[launch.launchpadId] : undefined));
  const rocket = useAppStore((s) => (launch?.rocketId ? s.rockets[launch.rocketId] : undefined));
  const payloads = useAppStore((s) => s.payloads);
  const bookmark = useAppStore((s) => s.bookmarks[launchId]);
  const [tab, setTab] = useState<Tab>('overview');
  const [notes, setNotes] = useState(bookmark?.notes ?? '');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [user, setUser] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setNotes(bookmark?.notes ?? '');
  }, [bookmark?.notes]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (bookmark && notes !== bookmark.notes) {
        void saveBookmarkNotes(launchId, notes);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [bookmark, launchId, notes]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const coord = pad ? readCoord(pad.latitude, pad.longitude) : null;
      if (!coord) return;
      const result = await requestUserLocation();
      if (cancelled || result.status !== 'granted') return;
      setUser(result.location);
      setDistanceKm(
        haversineKm(result.location.latitude, result.location.longitude, coord.latitude, coord.longitude),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [pad]);

  if (!launch) {
    return (
      <View style={[styles.missing, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.text }}>Launch not found in cache.</Text>
      </View>
    );
  }

  const payloadList = launch.payloadIds.map((id) => payloads[id]).filter(Boolean);

  return (
    <View style={[styles.safe, { backgroundColor: colors.bg, paddingBottom: insets.bottom }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.hero}>
          <Image
            source={launch.patchLarge ? { uri: launch.patchLarge } : launch.patchSmall ? { uri: launch.patchSmall } : undefined}
            style={styles.patch}
            cachePolicy={imageCachePolicy}
            contentFit="contain"
          />
          <Text style={[styles.title, { color: colors.text }]}>{launch.name}</Text>
          <StatusBadge status={statusOf(launch)} />
          <Text style={[styles.meta, { color: colors.muted }]}>{formatLaunchDate(launch.dateUtc)}</Text>
          <Pressable
            onPress={() => void toggleBookmark(launch.id)}
            style={[styles.bookmark, { borderColor: colors.border, backgroundColor: colors.card }]}
            accessibilityRole="button"
            accessibilityLabel={bookmark ? 'Remove bookmark' : 'Bookmark this launch'}
          >
            <Ionicons name={bookmark ? 'bookmark' : 'bookmark-outline'} size={18} color={colors.accent} />
            <Text style={[styles.bookmarkText, { color: colors.text }]}>
              {bookmark ? 'Bookmarked' : 'Bookmark'}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.tabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(['overview', 'launchpad', 'media'] as Tab[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              style={[styles.tab, tab === item && { backgroundColor: colors.bg }]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
            >
              <Text style={[styles.tabText, { color: tab === item ? colors.text : colors.muted }]}>
                {item.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'overview' ? (
          <View style={styles.section}>
            <Info label="Rocket" value={rocket?.name ?? 'Unknown'} colors={colors} />
            <Info label="Flight" value={`#${launch.flightNumber}`} colors={colors} />
            <Info
              label="Outcome"
              value={launch.upcoming ? 'Upcoming' : launch.success ? 'Successful' : 'Failed'}
              colors={colors}
            />
            <Info
              label="Payloads"
              value={
                payloadList.length
                  ? payloadList.map((p) => `${p?.name}${p?.massKg ? ` (${Math.round(p.massKg)} kg)` : ''}`).join('\n')
                  : launch.payloadIds.length
                    ? `${launch.payloadIds.length} payload id(s)`
                    : 'None listed'
              }
              colors={colors}
            />
            {launch.details ? <Info label="Mission" value={launch.details} colors={colors} /> : null}
            {launch.failures.length > 0 ? (
              <Info
                label="Failures"
                value={launch.failures.map((f) => f.reason ?? 'Unspecified failure').join('\n')}
                colors={colors}
              />
            ) : null}
            {bookmark ? (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.label, { color: colors.muted }]}>PRIVATE NOTES (ENCRYPTED)</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add a private note"
                  placeholderTextColor={colors.muted}
                  multiline
                  style={[styles.notes, { color: colors.text }]}
                  accessibilityLabel="Private notes"
                />
              </View>
            ) : (
              <Text style={[styles.hint, { color: colors.muted }]}>
                Bookmark this launch to attach an encrypted private note.
              </Text>
            )}
          </View>
        ) : null}

        {tab === 'launchpad' ? (
          <View style={styles.section}>
            <Info label="Pad" value={pad?.fullName ?? 'Unknown pad'} colors={colors} />
            <Info label="Location" value={[pad?.locality, pad?.region].filter(Boolean).join(', ') || 'Unknown'} colors={colors} />
            <Info label="Status" value={pad?.status ?? 'Unknown'} colors={colors} />
            <Info
              label="History"
              value={pad ? `${pad.launchSuccesses}/${pad.launchAttempts} successful attempts` : '—'}
              colors={colors}
            />
            {pad?.details ? <Info label="About" value={pad.details} colors={colors} /> : null}
            <Info
              label="Distance"
              value={distanceKm != null ? formatDistance(distanceKm) : 'Enable location to measure distance'}
              colors={colors}
            />
            <PadMap pad={pad} user={user} />
            {pad && readCoord(pad.latitude, pad.longitude) ? (
              <Pressable
                onPress={() => {
                  const coord = readCoord(pad.latitude, pad.longitude);
                  if (!coord) return;
                  void openDirections(coord.latitude, coord.longitude, pad.fullName);
                }}
                style={[styles.cta, { backgroundColor: colors.accent }]}
                accessibilityRole="button"
                accessibilityLabel="Get directions to launch pad"
              >
                <Text style={styles.ctaText}>Get Directions</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {tab === 'media' ? (
          <View style={styles.section}>
            {launch.flickr.length === 0 && !launch.patchLarge && !launch.webcast ? (
              <Text style={{ color: colors.muted }}>No media available for this launch.</Text>
            ) : null}
            {launch.flickr.map((uri) => (
              <Image key={uri} source={{ uri }} style={styles.photo} cachePolicy={imageCachePolicy} contentFit="cover" />
            ))}
            {launch.webcast ? (
              <Pressable onPress={() => void openExternal(launch.webcast)} style={[styles.link, { borderColor: colors.border }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>Open webcast</Text>
              </Pressable>
            ) : null}
            {launch.wikipedia ? (
              <Pressable onPress={() => void openExternal(launch.wikipedia)} style={[styles.link, { borderColor: colors.border }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>Wikipedia</Text>
              </Pressable>
            ) : null}
            {launch.article ? (
              <Pressable onPress={() => void openExternal(launch.article)} style={[styles.link, { borderColor: colors.border }]}>
                <Text style={{ color: colors.accent, fontWeight: '700' }}>Article</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Info({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { card: string; border: string; muted: string; text: string };
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', padding: 20, gap: 8 },
  patch: { width: 96, height: 96 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  meta: { fontSize: 13 },
  bookmark: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookmarkText: { fontWeight: '700' },
  tabs: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    padding: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  tabText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  section: { padding: 16, gap: 10 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 6 },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  value: { fontSize: 15, lineHeight: 22 },
  notes: { minHeight: 90, textAlignVertical: 'top', fontSize: 15 },
  hint: { fontSize: 13, lineHeight: 18 },
  cta: { borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  ctaText: { color: '#fff', fontWeight: '800' },
  photo: { width: '100%', height: 220, borderRadius: 14 },
  link: { borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
});
