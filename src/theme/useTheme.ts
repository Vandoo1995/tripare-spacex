import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';

export type Colors = {
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  success: string;
  danger: string;
  upcoming: string;
  overlay: string;
  tab: string;
};

const dark: Colors = {
  bg: '#07090F',
  surface: '#10151F',
  card: '#171E2B',
  border: '#2A3347',
  text: '#F4F7FB',
  muted: '#8B97B0',
  accent: '#FB7185',
  success: '#34D399',
  danger: '#FB7185',
  upcoming: '#38BDF8',
  overlay: 'rgba(0,0,0,0.55)',
  tab: '#0B0F18',
};

const light: Colors = {
  bg: '#F3F5F9',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#D9E0EC',
  text: '#101828',
  muted: '#667085',
  accent: '#E11D48',
  success: '#12B76A',
  danger: '#F04438',
  upcoming: '#1570EF',
  overlay: 'rgba(16,24,40,0.45)',
  tab: '#FFFFFF',
};

export function useTheme() {
  const system = useColorScheme();
  const themeMode = useAppStore((s) => s.themeMode);
  const resolved = themeMode === 'system' ? (system === 'light' ? 'light' : 'dark') : themeMode;
  const colors = resolved === 'light' ? light : dark;
  return useMemo(
    () => ({ colors, resolved, isDark: resolved === 'dark' }),
    [colors, resolved],
  );
}
