import { Image } from 'expo-image';
import { AppState } from 'react-native';

const MAX_MEMORY_HINT_MB = 40;

export function startImageCacheGuard(): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      void Image.clearMemoryCache();
    }
  });
  return () => sub.remove();
}

export const imageCachePolicy = 'memory-disk' as const;

export const IMAGE_CACHE_LIMIT_NOTE = `${MAX_MEMORY_HINT_MB}MB memory hint; disk LRU via expo-image`;
