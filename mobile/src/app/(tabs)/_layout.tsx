import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { theme } from '@/constants/app-theme';

const MIN_BOTTOM_TOUCH_OFFSET = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomTouchOffset = Math.max(insets.bottom, MIN_BOTTOM_TOUCH_OFFSET);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.green,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.surface,
          bottom: bottomTouchOffset,
          borderColor: theme.border,
          borderRadius: 20,
          borderTopColor: theme.border,
          borderWidth: 1,
          height: 72,
          left: 0,
          marginHorizontal: 12,
          overflow: 'hidden',
          position: 'absolute',
          right: 0,
        },
        tabBarItemStyle: { paddingVertical: 6 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 3 },
        sceneStyle: { backgroundColor: theme.background, paddingBottom: 128 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Sahneler', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'film' : 'film-outline'} color={String(color)} size={21} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Dublajlar', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'mic-circle' : 'mic-circle-outline'} color={String(color)} size={23} /> }} />
      <Tabs.Screen name="daily" options={{ title: 'Günlük', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={String(color)} size={21} /> }} />
      <Tabs.Screen name="library" options={{ title: 'K\u00fct\u00fcphanem', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'folder-open' : 'folder-open-outline'} color={String(color)} size={22} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Hesab\u0131m', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={String(color)} size={23} /> }} />
    </Tabs>
  );
}
