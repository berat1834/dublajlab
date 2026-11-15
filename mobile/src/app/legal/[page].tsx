import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';

const legalPages = {
  about: {
    title: 'Hakkımızda (Taslak)',
    paragraphs: [
      'DublajLab, kısa videolarınızı kendi sesinizle dublajlamanızı sağlayan yaratıcı bir medya aracıdır.',
      'Platform Public Beta aşamasındadır. Kullanıcıların yaratıcılıklarını sergilemeleri ve portföy içerikleri üretmeleri için tasarlanmıştır.',
      'Ekibimiz video düzenleme süreçlerini basitleştirerek herkesin kendi sesinden hikayeler anlatabilmesini hedefliyor.',
    ],
  },
  contact: {
    title: 'İletişim (Taslak)',
    paragraphs: [
      'Public Beta süresince resmi destek kanallarımız sınırlıdır. Geri bildirim ve hata bildirimleri için aşağıdaki adrese ulaşabilirsin.',
      'Sosyal medya hesaplarımız yakında aktif edilecektir.',
    ],
    email: true,
  },
  privacy: {
    title: 'Gizlilik Politikası (Taslak)',
    paragraphs: ['Bu metin Public Beta süreci için bilgilendirmedir; resmi gizlilik metni değildir.'],
    bullets: [
      'Ses ve video dosyaları işleme amacıyla sunucuya iletilir; geçici kopyalar işlem sonrasında silinir.',
      'Dışa aktarılan MP4 dosyalarının saklama süresi hesap türüne göre değişir. Kütüphanem ekranındaki tarih kesin sona erme zamanını gösterir.',
      'Verilerin reklam şirketlerine satılmaz; hizmeti sunmak için gerekli bulut sağlayıcıları kullanılabilir.',
    ],
  },
  terms: {
    title: 'Kullanım Koşulları (Taslak)',
    paragraphs: ['DublajLab Public Beta aşamasındadır; kesinti veya veri kaybı yaşanabilir.'],
    bullets: [
      'Yüklediğin video ve ses içeriklerinden sen sorumlusun; yalnızca kullanma hakkına sahip olduğun içerikleri yükle.',
      'Yanıltıcı, rıza dışı veya başkasının haklarını ihlal eden kullanımlar yasaktır.',
      'Kötüye kullanım durumunda hizmete erişim sınırlandırılabilir.',
    ],
  },
  copyright: {
    title: 'Telif Bildirimi (Taslak)',
    paragraphs: ['DublajLab’da paylaşılan ve yüklenen içeriklerin fikri mülkiyet haklarına saygı duy.'],
    bullets: [
      'Yalnızca sahibi olduğun, kullanım iznin bulunan veya açık lisanslı videoları yükle.',
      'Gerçek kişilerin seslerini taklit ederek onları yanıltıcı durumlara sokma.',
      'Telif veya güvenlik ihlali gördüğünde içeriği topluluk ekranından bildir.',
    ],
  },
  refund: {
    title: 'İade ve İptal Koşulları (Taslak)',
    paragraphs: ['Not: Aşağıdaki bilgiler taslak niteliğindedir; satın alma koşulları ödeme sağlayıcısının güncel sayfasında ayrıca gösterilir.'],
    bullets: [
      'Dijital hizmet ve cayma hakkı koşulları yürürlükteki mevzuata ve işlem detaylarına bağlıdır.',
      'Teknik bir nedenle vaat edilen hizmet sağlanamıyorsa destek kanalı üzerinden inceleme talep edebilirsin.',
    ],
  },
  distance_selling: {
    title: 'Mesafeli Satış Sözleşmesi (Taslak)',
    paragraphs: [
      'Bu metin taslaktır ve yasal satıcı bilgileri tamamlanmadan bağlayıcı sözleşme olarak değerlendirilmemelidir.',
      'VIP hizmetin kapsamı ve teslimi satın alma sırasında ödeme sağlayıcısının sayfasında gösterilir.',
      'Gerçek ticari faaliyet başladığında bu metin güncel yasal bilgilerle yenilenmelidir.',
    ],
  },
} as const;

type LegalPage = keyof typeof legalPages;

export default function LegalScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const pageKey = page as LegalPage;
  const content = legalPages[pageKey];

  if (!content) {
    return <Screen><EmptyState loading={false} title="Sayfa bulunamadı" message="İstenen bilgilendirme sayfası mevcut değil." actionLabel="Geri dön" onAction={() => router.back()} /></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></Pressable>
        <BrandHeader eyebrow="DublajLab · Bilgilendirme" title={content.title} />
        <View style={styles.card}>
          {content.paragraphs.map((paragraph) => <Text key={paragraph} style={styles.paragraph}>{paragraph}</Text>)}
          {'bullets' in content ? content.bullets.map((item) => <Text key={item} style={styles.bullet}>•  {item}</Text>) : null}
          {'email' in content ? (
            <Pressable onPress={() => void Linking.openURL('mailto:destek@dublajlab.com.tr')}>
              <Text style={styles.email}>destek@dublajlab.com.tr</Text>
            </Pressable>
          ) : null}
          <Text style={styles.draft}>Bu sayfa taslak/beta bilgilendirmesidir. Güncel resmi koşulların yerine geçmez.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  back: { color: theme.green, fontWeight: '900', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  card: { marginHorizontal: 20, padding: 20, gap: 15, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  paragraph: { color: theme.text, lineHeight: 22 },
  bullet: { color: theme.muted, lineHeight: 22, paddingLeft: 3 },
  email: { color: theme.green, fontWeight: '900', textDecorationLine: 'underline' },
  draft: { color: '#fbbf24', fontSize: 12, lineHeight: 18, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 12 },
});
