import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { theme } from '@/constants/app-theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.green,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border, height: 66 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', paddingBottom: 7 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Sahneler', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'film' : 'film-outline'} color={String(color)} size={21} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Dublajlar', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'mic-circle' : 'mic-circle-outline'} color={String(color)} size={23} /> }} />
      <Tabs.Screen name="library" options={{ title: 'K\u00fct\u00fcphanem', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'folder-open' : 'folder-open-outline'} color={String(color)} size={22} /> }} />
      <Tabs.Screen name="account" options={{ title: 'Hesab\u0131m', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={String(color)} size={23} /> }} />
    </Tabs>
  );
}
