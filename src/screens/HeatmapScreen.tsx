import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from '../components/AppMap';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { applyFilters, countsByLaunchpad } from '../domain/filters';
import { clusterPoints, densityColor, radiusKmForDelta, type Cluster } from '../domain/clustering';
import { readCoord } from '../domain/geo';
import type { MapStackParamList } from '../navigation/types';
import { selectLaunchList, selectLaunchpads, useAppStore } from '../store/appStore';
import { useTheme } from '../theme/useTheme';
import { SyncBanner } from '../components/SyncBanner';
import { syncNow } from '../sync/syncEngine';

type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

const INITIAL_REGION: Region = {
  latitude: 28.5,
  longitude: -80.6,
  latitudeDelta: 18,
  longitudeDelta: 18,
};

export function HeatmapScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MapStackParamList>>();
  const { colors } = useTheme();
  const launches = useAppStore(selectLaunchList);
  const pads = useAppStore(selectLaunchpads);
  const filters = useAppStore((s) => s.filters);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  const filtered = useMemo(() => applyFilters(launches, filters), [filters, launches]);
  const counts = useMemo(() => countsByLaunchpad(filtered), [filtered]);
  const max = Math.max(1, ...Object.values(counts));

  const points = useMemo(
    () =>
      pads.flatMap((pad) => {
        const coord = readCoord(pad.latitude, pad.longitude);
        if (!coord) return [];
        return [
          {
            id: pad.id,
            latitude: coord.latitude,
            longitude: coord.longitude,
            weight: counts[pad.id] ?? 0,
          },
        ];
      }),
    [counts, pads],
  );

  const clusters = useMemo(
    () => clusterPoints(points, radiusKmForDelta(region.latitudeDelta)),
    [points, region.latitudeDelta],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: colors.muted }]}>VENUE ANALYSIS</Text>
        <Text style={[styles.title, { color: colors.text }]}>Launch density</Text>
      </View>
      <SyncBanner onRetry={() => void syncNow(true)} />
      <Text style={[styles.hint, { color: colors.muted }]}>
        Color = filtered launch count. Same list filters apply here.
      </Text>

      {Platform.OS === 'web' ? (
        <View style={styles.list}>
          {pads
            .slice()
            .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
            .map((pad) => (
              <View key={pad.id} style={[styles.padRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.swatch, { backgroundColor: densityColor(counts[pad.id] ?? 0, max) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.padName, { color: colors.text }]}>{pad.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {counts[pad.id] ?? 0} launches · {pad.locality}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={INITIAL_REGION}
          onRegionChangeComplete={setRegion}
          accessibilityLabel="Launch pad density map"
        >
          {clusters.map((cluster) => (
            <Marker
              key={cluster.id}
              coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
              onPress={() => {
                if (cluster.type === 'point') {
                  setSelectedCluster(cluster);
                  return;
                }
                setRegion({
                  latitude: cluster.latitude,
                  longitude: cluster.longitude,
                  latitudeDelta: Math.max(0.4, region.latitudeDelta / 3),
                  longitudeDelta: Math.max(0.4, region.longitudeDelta / 3),
                });
              }}
            >
              <View
                style={[
                  styles.pin,
                  {
                    backgroundColor: densityColor(cluster.weight, max),
                    width: cluster.type === 'cluster' ? 44 : 28,
                    height: cluster.type === 'cluster' ? 44 : 28,
                    borderRadius: cluster.type === 'cluster' ? 22 : 14,
                  },
                ]}
              >
                <Text style={styles.pinText}>
                  {cluster.type === 'cluster' ? cluster.memberIds.length : cluster.weight}
                </Text>
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.legend}>
        <LegendDot color="#22C55E" label="Low" />
        <LegendDot color="#EAB308" label="Medium" />
        <LegendDot color="#E11D48" label="High" />
      </View>

      {selectedCluster?.type === 'point' ? (
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            const pad = pads.find((item) => item.id === selectedCluster.id);
            const launch = filtered.find((item) => item.launchpadId === selectedCluster.id);
            if (launch) navigation.navigate('LaunchDetails', { launchId: launch.id });
            else if (pad) setSelectedCluster(null);
          }}
        >
          <Text style={[styles.padName, { color: colors.text }]}>
            {pads.find((p) => p.id === selectedCluster.id)?.fullName}
          </Text>
          <Text style={{ color: colors.muted }}>
            {selectedCluster.weight} filtered launches · tap to open a mission
          </Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  title: { fontSize: 28, fontWeight: '800' },
  hint: { marginHorizontal: 20, marginBottom: 8, fontSize: 12 },
  map: { flex: 1 },
  list: { flex: 1, paddingHorizontal: 16, gap: 8 },
  padRow: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  padName: { fontWeight: '700' },
  pin: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  pinText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingVertical: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 5 },
  sheet: { margin: 16, borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
});
