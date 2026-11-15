import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const { user, loading } = useAuth();

  if (!user) {
    return (
      <Screen>
        <EmptyState
          loading={loading}
          title="Profilin için giriş yap"
          message="Herkese açık profil görünümünü görmek için hesabına giriş yap."
          actionLabel="Hesabıma git"
          onAction={() => router.navigate('/account')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.content}>
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.back}>← Hesabıma dön</Text>
        </Pressable>
        <BrandHeader eyebrow="Profilim" title="Herkese açık görünüm" />
        <View style={styles.profile}>
          {user.avatar_url ? (
            <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.initial}>{user.display_name.charAt(0).toLocaleUpperCase('tr-TR')}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.display_name}</Text>
          <Text style={styles.tier}>{user.has_active_vip ? 'VIP' : 'Free'} · DublajLab</Text>
        </View>
        <View style={styles.preview}>
          <Text style={styles.badge}>YAKINDA</Text>
          <Text style={styles.previewTitle}>Profil sayfası geliştiriliyor</Text>
          <Text style={styles.previewCopy}>
            Web’deki gibi profil kartın ve hesap seviyen burada görünür. Herkese açık dublajların profil akışı yakında eklenecek.
          </Text>
          <ActionButton label="Dublaj kütüphanem" onPress={() => router.navigate('/library')} />
        </View>
        <ActionButton label="Profili düzenle" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingBottom: 28 },
  back: { color: theme.green, fontWeight: '900', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  profile: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 28, borderBottomWidth: 1, borderBottomColor: theme.border },
  avatar: { width: 80, height: 80, borderRadius: 22 },
  avatarFallback: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: theme.greenDark },
  initial: { color: theme.green, fontSize: 30, fontWeight: '900' },
  name: { color: theme.text, fontSize: 26, fontWeight: '900', marginTop: 15 },
  tier: { color: theme.muted, marginTop: 4 },
  preview: { margin: 20, padding: 22, alignItems: 'center', gap: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border, borderRadius: 20 },
  badge: { color: '#fcd34d', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  previewTitle: { color: theme.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  previewCopy: { color: theme.muted, lineHeight: 21, textAlign: 'center', marginBottom: 6 },
});
