import * as Location from 'expo-location';

export type UserLocation = {
  latitude: number;
  longitude: number;
};

export type LocationResult =
  | { status: 'granted'; location: UserLocation }
  | { status: 'denied' }
  | { status: 'unavailable'; reason: string };

export async function requestUserLocation(): Promise<LocationResult> {
  const services = await Location.hasServicesEnabledAsync();
  if (!services) {
    return { status: 'unavailable', reason: 'Location services are turned off.' };
  }

  const existing = await Location.getForegroundPermissionsAsync();
  let granted = existing.status === Location.PermissionStatus.GRANTED;
  if (!granted) {
    const requested = await Location.requestForegroundPermissionsAsync();
    granted = requested.status === Location.PermissionStatus.GRANTED;
  }
  if (!granted) return { status: 'denied' };

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    status: 'granted',
    location: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
  };
}
