import { Linking, Platform } from 'react-native';

export async function openDirections(lat: number, lon: number, label: string): Promise<void> {
  const encoded = encodeURIComponent(label);
  const apple = `http://maps.apple.com/?daddr=${lat},${lon}&q=${encoded}`;
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
  const url = Platform.OS === 'ios' ? apple : google;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    await Linking.openURL(google);
    return;
  }
  await Linking.openURL(url);
}

export async function openExternal(url: string | null): Promise<void> {
  if (!url) return;
  const supported = await Linking.canOpenURL(url);
  if (supported) await Linking.openURL(url);
}
