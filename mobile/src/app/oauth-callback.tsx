import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';

import { Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';

export default function OAuthCallbackScreen() {
  const callbackUrl = Linking.useURL();
  const { completeOAuthCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!callbackUrl) return;
    let active = true;

    completeOAuthCallback(callbackUrl)
      .then(() => {
        if (active) router.replace('/account');
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Google girişi tamamlanamadı.');
        }
      });

    return () => { active = false; };
  }, [callbackUrl, completeOAuthCallback]);

  return (
    <Screen>
      <View style={styles.content}>
        {error ? (
          <>
            <Text style={styles.icon}>!</Text>
            <Text style={styles.title}>Giriş tamamlanamadı</Text>
            <Text style={styles.copy}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => router.replace('/account')} style={styles.button}>
              <Text style={styles.buttonText}>Giriş ekranına dön</Text>
            </Pressable>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.green} />
            <Text style={styles.title}>Google girişi tamamlanıyor</Text>
            <Text style={styles.copy}>Hesabın doğrulanıyor, lütfen bekle.</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { width: 58, height: 58, borderRadius: 20, color: '#fecdd3', backgroundColor: '#4c101d', textAlign: 'center', textAlignVertical: 'center', fontSize: 32, fontWeight: '900' },
  title: { color: theme.text, fontSize: 23, fontWeight: '900', textAlign: 'center', marginTop: 20 },
  copy: { color: theme.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 9 },
  button: { minHeight: 50, minWidth: 220, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: theme.green, marginTop: 22, paddingHorizontal: 18 },
  buttonText: { color: '#071000', fontWeight: '900' },
});
