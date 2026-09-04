import { Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from './AppMap';
import type { Launchpad } from '../domain/types';
import { readCoord } from '../domain/geo';
import { useTheme } from '../theme/useTheme';

type Props = {
  pad?: Launchpad;
  user?: { latitude: number; longitude: number } | null;
};

export function PadMap({ pad, user }: Props) {
  const { colors } = useTheme();
  const coord = readCoord(pad?.latitude, pad?.longitude);
  if (!pad || !coord) {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.muted }}>No coordinates for this pad.</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.fallback, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{pad.fullName}</Text>
        <Text style={{ color: colors.muted }}>
          {coord.latitude.toFixed(4)}, {coord.longitude.toFixed(4)}
        </Text>
        <Text style={{ color: colors.muted }}>Native map is available on iOS/Android.</Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      initialRegion={{
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: 0.6,
        longitudeDelta: 0.6,
      }}
      showsUserLocation={Boolean(user)}
      accessibilityLabel="Launch pad map"
    >
      <Marker
        coordinate={coord}
        title={pad.name}
        description={pad.fullName}
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { height: 240, borderRadius: 14, overflow: 'hidden' },
  fallback: { minHeight: 140, borderWidth: 1, borderRadius: 14, padding: 16, gap: 6, justifyContent: 'center' },
});
