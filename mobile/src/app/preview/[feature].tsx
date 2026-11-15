import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ActionButton, BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';

const previews = {
  scenes: {
    title: 'Sahne yayınlama stüdyosu yakında',
    description: 'İnceleme ve yayınlama iş akışı tamamlanana kadar burada sahte taslak veya yayın sayıları göstermiyoruz.',
    note: 'Yalnızca haklarına sahip olduğun, kendi ürettiğin veya açık lisanslı videoları kullan.',
    action: 'Kendi videonu yükle',
    route: '/upload',
  },
  favorites: {
    title: 'Favoriler yakında',
    description: 'Favori içeriklerini kaydetme özelliği henüz kullanılabilir değil. Burada sahte bir liste göstermiyoruz.',
    action: 'Sahneleri keşfet',
    route: '/',
  },
  credits: {
    title: 'Kredi sistemi henüz aktif değil',
    description: 'Kullanılabilir kredi veya işlem geçmişi bulunmuyor. Güncel Free/VIP özelliklerini üyelik sayfasında inceleyebilirsin.',
    action: 'Üyelikleri incele',
    route: '/membership',
  },
  room: {
    title: 'Çok oyunculu odalar henüz aktif değil',
    description: 'Oda kodu, oyuncu eşleştirme ve kredi sistemi için üretim ortamında güvenli bir backend akışı yok.',
    action: 'Tek kişilik stüdyoyu kullan',
    route: '/upload',
  },
} as const;

type PreviewFeature = keyof typeof previews;

export default function PreviewScreen() {
  const { feature } = useLocalSearchParams<{ feature: string }>();
  const preview = previews[feature as PreviewFeature];

  if (!preview) {
    return <Screen><EmptyState loading={false} title="Bölüm bulunamadı" message="İstenen özellik mevcut değil." actionLabel="Geri dön" onAction={() => router.back()} /></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></Pressable>
        <BrandHeader eyebrow="Tasarım önizlemesi · Yakında" title={preview.title} />
        <View style={styles.card}>
          <Text style={styles.description}>{preview.description}</Text>
          {'note' in preview ? <Text style={styles.note}>{preview.note}</Text> : null}
          <ActionButton label={preview.action} onPress={() => router.navigate(preview.route)} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  back: { color: theme.green, fontWeight: '900', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  card: { marginHorizontal: 20, padding: 20, gap: 16, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.border },
  description: { color: theme.muted, lineHeight: 22 },
  note: { color: '#fbbf24', fontSize: 12, lineHeight: 19 },
});
