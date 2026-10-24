import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { theme } from '@/constants/app-theme';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.screen}>{children}</SafeAreaView>;
}

export function BrandHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.header}>
      <View style={styles.logo}><Text style={styles.logoText}>⚗</Text></View>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

export function EmptyState({ loading, message }: { loading: boolean; message: string }) {
  return (
    <View style={styles.empty}>
      {loading ? <ActivityIndicator color={theme.green} /> : <Text style={styles.emptyText}>{message}</Text>}
    </View>
  );
}

export function ActionButton({ label, onPress, disabled }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.button, (pressed || disabled) && styles.buttonDisabled]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logo: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border },
  logoText: { color: theme.green, fontSize: 25, fontWeight: '900' },
  headerCopy: { flex: 1 },
  eyebrow: { color: theme.green, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' },
  title: { color: theme.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.7 },
  empty: { minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: theme.muted, textAlign: 'center', lineHeight: 22 },
  button: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.green, paddingHorizontal: 18 },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: '#071000', fontSize: 16, fontWeight: '900' },
});
