import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

export function EmptyState({
  loading,
  message,
  title,
  icon = '✦',
  actionLabel,
  onAction,
}: {
  loading: boolean;
  message: string;
  title?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      {loading ? (
        <ActivityIndicator color={theme.green} />
      ) : (
        <>
          <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>{icon}</Text></View>
          {title ? <Text style={styles.emptyTitle}>{title}</Text> : null}
          <Text style={styles.emptyText}>{message}</Text>
          {actionLabel && onAction ? (
            <View style={styles.emptyAction}>
              <ActionButton label={actionLabel} onPress={onAction} />
            </View>
          ) : null}
        </>
      )}
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
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, disabled && styles.buttonDisabled]}>
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
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
  empty: { minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.greenDark, borderWidth: 1, borderColor: '#426715', marginBottom: 15 },
  emptyIconText: { color: theme.green, fontSize: 27, fontWeight: '900' },
  emptyTitle: { color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 7 },
  emptyText: { maxWidth: 300, color: theme.muted, textAlign: 'center', lineHeight: 22 },
  emptyAction: { width: '100%', maxWidth: 260, marginTop: 18 },
  button: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.green, paddingHorizontal: 18 },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  buttonDisabled: { backgroundColor: '#33451f', borderWidth: 1, borderColor: '#4b632d' },
  buttonText: { color: '#071000', fontSize: 16, fontWeight: '900' },
  buttonTextDisabled: { color: '#9bb979' },
});
