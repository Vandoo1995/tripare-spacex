import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const KEY_NAME = 'tripare.notes.aes.v1';
let memoryFallback: string | null = null;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function getOrCreateNotesKey(): Promise<string> {
  const available = await SecureStore.isAvailableAsync();
  if (available) {
    const existing = await SecureStore.getItemAsync(KEY_NAME);
    if (existing) return existing;
    const bytes = await Crypto.getRandomBytesAsync(32);
    const hex = bytesToHex(bytes);
    await SecureStore.setItemAsync(KEY_NAME, hex, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return hex;
  }
  if (!memoryFallback) {
    const bytes = await Crypto.getRandomBytesAsync(32);
    memoryFallback = bytesToHex(bytes);
  }
  return memoryFallback;
}
