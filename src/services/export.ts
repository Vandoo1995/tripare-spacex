import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { Launch } from '../domain/types';

export async function exportLaunchesJson(launches: Launch[]): Promise<void> {
  const payload = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      count: launches.length,
      launches,
    },
    null,
    2,
  );
  const file = new File(Paths.cache, `spacex-launches-${Date.now()}.json`);
  file.create({ overwrite: true });
  file.write(payload);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing is not available on this device');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Export filtered launches',
    UTI: 'public.json',
  });
}
