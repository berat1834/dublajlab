import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, type ColorValue } from 'react-native';

import { theme } from '@/constants/app-theme';
import { AuthProvider } from '@/context/AuthContext';

const icon = (value: string, color: ColorValue) => <Text style={{ color, fontSize: 20 }}>{value}</Text>;

export default function RootLayout() {
  return (
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
        <Tabs.Screen name="index" options={{ title: 'Sahneler', tabBarIcon: ({ color }) => icon('▣', color) }} />
        <Tabs.Screen name="community" options={{ title: 'Dublajlar', tabBarIcon: ({ color }) => icon('◉', color) }} />
        <Tabs.Screen name="account" options={{ title: 'Hesabım', tabBarIcon: ({ color }) => icon('●', color) }} />
        <Tabs.Screen name="scene/[id]" options={{ href: null }} />
      </Tabs>
    </AuthProvider>
  );
}
