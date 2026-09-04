import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

type MapViewProps = {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  initialRegion?: unknown;
  onRegionChangeComplete?: (region: unknown) => void;
  showsUserLocation?: boolean;
  accessibilityLabel?: string;
};

export default function MapView({ style, children }: MapViewProps) {
  return <View style={style}>{children}</View>;
}

export function Marker(): null {
  return null;
}
