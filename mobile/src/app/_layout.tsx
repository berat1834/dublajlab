import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="scene/[id]" />
          <Stack.Screen name="dub/[id]" />
          <Stack.Screen name="upload" />
        </Stack>
      </AuthProvider>
    </AppErrorBoundary>
  );
}
