import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { ActionButton, BrandHeader, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';

const steps = [
  { title: '1. Sahne seç', description: 'Sahne galerisinden bir video aç veya yalnızca kullanım hakkına sahip olduğun bir videoyu cihazından yükle.' },
  { title: '2. Replikleri kaydet', description: 'Zaman çizelgesini takip et, mikrofon izni ver ve her repliği sırayla seslendir.' },
  { title: '3. Dublajını oynat', description: 'İşlem tamamlanınca videoyu oynatabilir ve Kütüphanem’den dosyanı paylaşabilir veya indirebilirsin.' },
];

export default function HelpScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></Pressable>
        <BrandHeader eyebrow="Yardım" title="Nasıl kullanılır?" />
        {steps.map((step) => (
          <View key={step.title} style={styles.step}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.copy}>{step.description}</Text>
          </View>
        ))}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Etik ve telif bilinci</Text>
          <Text style={styles.copy}>Yalnızca kullanma hakkına sahip olduğun içerikleri yükle. Gerçek kişileri taklit eden, yanıltıcı, rıza dışı veya kişisel verileri ihlal eden içerikleri oluşturma ya da paylaşma. Uygunsuz bir topluluk içeriğini bildir.</Text>
        </View>
        <ActionButton label="Dublaj stüdyosuna git" onPress={() => router.push('/upload')} />
        <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'contact' } })} style={styles.contact}>
          <Text style={styles.contactText}>Destek ve iletişim</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  back: { color: theme.green, fontWeight: '900', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  step: { marginHorizontal: 20, marginBottom: 10, padding: 18, gap: 7, borderRadius: 18, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  stepTitle: { color: theme.text, fontSize: 17, fontWeight: '900' },
  copy: { color: theme.muted, lineHeight: 21 },
  notice: { marginHorizontal: 20, marginVertical: 12, padding: 18, gap: 8, borderRadius: 18, backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border },
  noticeTitle: { color: theme.purple, fontWeight: '900' },
  contact: { alignItems: 'center', padding: 16 },
  contactText: { color: theme.green, fontWeight: '800' },
});
