import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { theme } from '@/constants/app-theme';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
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
        <Tabs.Screen name="account" options={{ title: 'Hesabım', tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} color={String(color)} size={23} /> }} />
        <Tabs.Screen name="scene/[id]" options={{ href: null }} />
        </Tabs>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
