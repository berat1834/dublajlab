import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';

import { Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { getMobileOAuthToken, MOBILE_OAUTH_CALLBACK } from '@/lib/api';

export default function OAuthCallbackScreen() {
  const callbackUrl = Linking.useURL();
  const { token: routeToken } = useLocalSearchParams<{ token?: string | string[] }>();
  const { completeOAuthCallback } = useAuth();
  const [error, setError] = useState('');
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const processedUrl = useRef<string | null>(null);
  const token = Array.isArray(routeToken) ? routeToken[0] : routeToken;
  const routeUrl = token ? `${MOBILE_OAUTH_CALLBACK}?token=${encodeURIComponent(token)}` : null;
  const oauthUrl = [routeUrl, callbackUrl, initialUrl].find(
    (candidate): candidate is string => Boolean(candidate && getMobileOAuthToken(candidate)),
  ) ?? null;

  useEffect(() => {
    Linking.getInitialURL().then(setInitialUrl).catch(() => setInitialUrl(null));
  }, []);

  useEffect(() => {
    if (!oauthUrl || processedUrl.current === oauthUrl) return;
    processedUrl.current = oauthUrl;
    let active = true;
    setError('');

    completeOAuthCallback(oauthUrl)
      .then(() => {
        if (active) router.replace('/account');
      })
      .catch((reason) => {
        if (active) {
          setError(reason instanceof Error ? reason.message : 'Google girişi tamamlanamadı.');
        }
      });

    return () => { active = false; };
  }, [completeOAuthCallback, oauthUrl]);

  useEffect(() => {
    if (oauthUrl || error) return;
    const timeout = setTimeout(() => {
      setError('OAuth dönüş bilgisi alınamadı. Giriş ekranına dönüp tekrar deneyin.');
    }, 5000);
    return () => clearTimeout(timeout);
  }, [error, oauthUrl]);

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
            <Text style={styles.title}>Sosyal giriş tamamlanıyor</Text>
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
