import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LaunchListScreen } from '../screens/LaunchListScreen';
import { LaunchDetailsScreen } from '../screens/LaunchDetailsScreen';
import { HeatmapScreen } from '../screens/HeatmapScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useTheme } from '../theme/useTheme';
import type {
  BookmarksStackParamList,
  LaunchesStackParamList,
  MapStackParamList,
  RootTabParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const LaunchesStack = createNativeStackNavigator<LaunchesStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const BookmarksStack = createNativeStackNavigator<BookmarksStackParamList>();

function LaunchesNavigator() {
  const { colors } = useTheme();
  return (
    <LaunchesStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <LaunchesStack.Screen name="LaunchList" component={LaunchListScreen} options={{ headerShown: false }} />
      <LaunchesStack.Screen name="LaunchDetails" component={LaunchDetailsScreen} options={{ title: 'Launch' }} />
    </LaunchesStack.Navigator>
  );
}

function MapNavigator() {
  const { colors } = useTheme();
  return (
    <MapStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <MapStack.Screen name="Heatmap" component={HeatmapScreen} options={{ headerShown: false }} />
      <MapStack.Screen name="LaunchDetails" component={LaunchDetailsScreen} options={{ title: 'Launch' }} />
    </MapStack.Navigator>
  );
}

function BookmarksNavigator() {
  const { colors } = useTheme();
  return (
    <BookmarksStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <BookmarksStack.Screen name="BookmarkList" component={BookmarksScreen} options={{ headerShown: false }} />
      <BookmarksStack.Screen name="LaunchDetails" component={LaunchDetailsScreen} options={{ title: 'Launch' }} />
    </BookmarksStack.Navigator>
  );
}

export function RootNavigator() {
  const { colors, isDark } = useTheme();
  const navTheme = isDark
    ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.tab, text: colors.text, border: colors.border, primary: colors.accent } }
    : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.tab, text: colors.text, border: colors.border, primary: colors.accent } };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.tab, borderTopColor: colors.border },
          tabBarIcon: ({ color, size }) => {
            const name =
              route.name === 'LaunchesTab' ? 'rocket' : route.name === 'MapTab' ? 'map' : 'bookmark';
            return <Ionicons name={name} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="LaunchesTab" options={{ title: 'Launches' }}>
          {() => (
            <ErrorBoundary label="launches">
              <LaunchesNavigator />
            </ErrorBoundary>
          )}
        </Tab.Screen>
        <Tab.Screen name="MapTab" options={{ title: 'Map' }}>
          {() => (
            <ErrorBoundary label="map">
              <MapNavigator />
            </ErrorBoundary>
          )}
        </Tab.Screen>
        <Tab.Screen name="BookmarksTab" options={{ title: 'Bookmarks' }}>
          {() => (
            <ErrorBoundary label="bookmarks">
              <BookmarksNavigator />
            </ErrorBoundary>
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
