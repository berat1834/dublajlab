import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { MembershipPlan } from '@/types';

const mobileCheckoutEnabled = process.env.EXPO_PUBLIC_MOBILE_CHECKOUT_ENABLED === 'true';

function formatPrice(plan: MembershipPlan) {
  const prefix = plan.price_currency === 'TRY' ? '₺' : `${plan.price_currency} `;
  const amount = plan.price_amount.toLocaleString('tr-TR');
  return `${prefix}${amount}${plan.billing_period === 'month' && plan.price_amount > 0 ? ' / ay' : ''}`;
}

export default function MembershipScreen() {
  const { user, token, refreshUser } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.membershipPlans();
      setPlans(result.plans);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Üyelik bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load the supported plan capabilities when the membership screen opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPlans();
  }, [loadPlans]);

  const refreshMembership = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      Alert.alert('Üyelik yenilendi', 'Hesap durumun güncellendi.');
    } catch (reason) {
      Alert.alert('Güncellenemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  const startCheckout = useCallback(async () => {
    if (!mobileCheckoutEnabled) {
      Alert.alert('Mobil satın alma kapalı', 'Yasal satış metinleri ve mobil ödeme akışı tamamlanana kadar uygulama içinden satın alma yapılamaz.');
      return;
    }
    if (!token) {
      router.navigate('/account');
      return;
    }
    try {
      const result = await api.checkout(token);
      await Linking.openURL(result.checkout_url);
    } catch (reason) {
      Alert.alert('Ödeme açılamadı', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    }
  }, [token]);

  if (loading) {
    return <Screen><ActivityIndicator style={styles.loader} color={theme.green} /></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>← Hesabıma dön</Text>
        </Pressable>
        <BrandHeader eyebrow="DublajLab üyeliği" title="Stüdyo VIP" />
        {error ? (
          <EmptyState loading={false} title="Üyelik bilgileri alınamadı" message={error} actionLabel="Tekrar dene" onAction={() => void loadPlans()} />
        ) : (
          <>
            <Text style={styles.description}>
              Ücretsiz ve VIP üyeliklerin özelliklerini karşılaştır. VIP satın alma ve mevcut hakkın yenilenmesi hesabına bağlıdır.
            </Text>
            {plans.map((plan) => {
              const isVip = plan.id === 'vip';
              const active = isVip && Boolean(user?.has_active_vip);
              return (
                <View key={plan.id} style={[styles.card, isVip && styles.vipCard]}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.price}>{formatPrice(plan)}</Text>
                  <Text style={styles.feature}>MP4 dışa aktarma: {plan.max_export_resolution}</Text>
                  <Text style={styles.feature}>Kendi videosunu yükleme ve mikrofon: Dahil</Text>
                  <Text style={styles.feature}>AI ses: {plan.ai_voice ? 'Dahil' : 'Kilitli'}</Text>
                  {active ? (
                    <Text style={styles.active}>✓ VIP üyeliğin aktif</Text>
                  ) : isVip ? (
                    <ActionButton
                      label={mobileCheckoutEnabled ? 'VIP satın al' : 'Mobil satın alma yakında'}
                      disabled={!mobileCheckoutEnabled}
                      onPress={() => void startCheckout()}
                    />
                  ) : user?.membership_tier === 'free' ? (
                    <Text style={styles.current}>Mevcut planın</Text>
                  ) : null}
                </View>
              );
            })}
            <View style={styles.note}>
              <Text style={styles.noteTitle}>{mobileCheckoutEnabled ? 'Güvenli ödeme' : 'Mobil ödeme durumu'}</Text>
              <Text style={styles.noteText}>{mobileCheckoutEnabled
                ? 'Ödeme sağlayıcısının güvenli sayfası açılır; kart bilgilerin DublajLab uygulamasında saklanmaz.'
                : 'Yasal satış metinleri ve mobil ödeme akışı tamamlanana kadar uygulama içinden satın alma kapalıdır.'}</Text>
            </View>
            {user ? (
              <Pressable disabled={refreshing} onPress={() => void refreshMembership()} style={styles.refresh}>
                <Text style={styles.refreshText}>{refreshing ? 'Üyelik yenileniyor…' : 'Üyeliği yenile'}</Text>
              </Pressable>
            ) : (
              <ActionButton label="Giriş yap" onPress={() => router.navigate('/account')} />
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  loader: { flex: 1 },
  back: { color: theme.green, fontWeight: '900', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  description: { color: theme.muted, lineHeight: 22, marginHorizontal: 20, marginBottom: 16 },
  card: { marginHorizontal: 20, marginBottom: 14, padding: 20, gap: 12, borderWidth: 1, borderColor: theme.border, borderRadius: 20, backgroundColor: theme.surface },
  vipCard: { borderColor: '#fbbf24', backgroundColor: '#20190c' },
  planName: { color: theme.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  price: { color: theme.text, fontSize: 30, fontWeight: '900' },
  feature: { color: theme.text, lineHeight: 20 },
  current: { color: theme.muted, fontWeight: '800', textAlign: 'center', padding: 10 },
  active: { color: theme.green, fontWeight: '900', textAlign: 'center', padding: 10 },
  note: { marginHorizontal: 20, marginTop: 4, padding: 16, borderRadius: 16, backgroundColor: theme.surfaceRaised },
  noteTitle: { color: theme.text, fontWeight: '900' },
  noteText: { color: theme.muted, lineHeight: 20, marginTop: 6 },
  refresh: { alignSelf: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  refreshText: { color: theme.green, fontWeight: '900' },
});
