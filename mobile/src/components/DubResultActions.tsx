import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import Feather from '@expo/vector-icons/Feather';

import { theme } from '@/constants/app-theme';
import { absoluteApiUrl, api } from '@/lib/api';

const SHARE_TEXT = 'Dublajım hazır!';

type Props = {
  downloadUrl: string;
  fileName: string;
  token?: string | null;
  hasVip?: boolean;
  onRetrySame: () => void;
  onNewVideo: () => void;
};

/** Post-export action panel, mirroring the website's "Sırada ne var?" block. */
export function DubResultActions({ downloadUrl, fileName, token, hasVip, onRetrySame, onNewVideo }: Props) {
  const [sharing, setSharing] = useState(false);
  const outputUrl = absoluteApiUrl(downloadUrl);

  const shareFile = useCallback(async (dialogTitle: string) => {
    if (sharing) return;
    setSharing(true);
    try {
      if (!await Sharing.isAvailableAsync()) throw new Error('Bu cihazda dosya paylaşımı kullanılamıyor.');
      const file = await api.downloadExport(downloadUrl, fileName, token);
      await Sharing.shareAsync(file.uri, { dialogTitle, mimeType: 'video/mp4', UTI: 'public.mpeg-4' });
    } catch (reason) {
      Alert.alert('Paylaşım açılamadı', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setSharing(false);
    }
  }, [downloadUrl, fileName, sharing, token]);

  const copyLink = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(outputUrl);
      Alert.alert('Bağlantı kopyalandı!');
    } catch {
      Alert.alert('İşlem başarısız', 'Bağlantı kopyalanamadı.');
    }
  }, [outputUrl]);

  const shareOnX = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(outputUrl)}`;
    void Linking.openURL(url).catch(() => Alert.alert('X açılamadı', 'Tekrar deneyin.'));
  }, [outputUrl]);

  return <View style={styles.panel}>
    <Text style={styles.title}>Sırada ne var?</Text>
    <Text style={styles.description}>Sonucu indirebilir, sosyal medyada paylaşabilir veya yeni projeye başlayabilirsin.</Text>

    {token ? (
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.primary, pressed && styles.pressed]} onPress={() => router.navigate('/(tabs)/library')}>
        <Feather name="folder" size={17} color={theme.background} /><Text style={styles.primaryText}>Kütüphanemde aç ve yayınla</Text>
      </Pressable>
    ) : (
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.share, pressed && styles.pressed]} onPress={() => router.navigate('/account')}>
        <Feather name="folder" size={17} color={theme.green} /><Text style={styles.shareText}>Kütüphaneye kaydetmek için giriş yap</Text>
      </Pressable>
    )}

    <Pressable accessibilityRole="button" disabled={sharing} style={({ pressed }) => [styles.share, pressed && styles.pressed]} onPress={() => void shareFile('Dublajını kaydet veya paylaş')}>
      {sharing ? <ActivityIndicator size="small" color={theme.green} /> : <Feather name="share-2" size={15} color={theme.green} />}
      <Text style={styles.shareText}>{sharing ? 'Hazırlanıyor…' : 'Paylaş'}</Text>
    </Pressable>

    <View style={styles.grid}>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.cell, styles.copy, pressed && styles.pressed]} onPress={() => void copyLink()}>
        <Feather name="link" size={14} color={theme.text} /><Text style={[styles.cellText, { color: theme.text }]}>Linki Kopyala</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.cell, styles.x, pressed && styles.pressed]} onPress={shareOnX}>
        <Text style={[styles.cellText, { color: '#38bdf8' }]}>X’te Paylaş</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={sharing} style={({ pressed }) => [styles.cell, styles.tiktok, pressed && styles.pressed]} onPress={() => void shareFile('TikTok’ta paylaş')}>
        <Text style={[styles.cellText, { color: '#f472b6' }]}>TikTok</Text>
      </Pressable>
      <Pressable accessibilityRole="button" disabled={sharing} style={({ pressed }) => [styles.cell, styles.reels, pressed && styles.pressed]} onPress={() => void shareFile('Instagram Reels olarak paylaş')}>
        <Text style={[styles.cellText, { color: '#e879f9' }]}>IG Reels</Text>
      </Pressable>
    </View>

    {!hasVip ? (
      <View style={styles.vip}>
        <View style={styles.vipCopy}>
          <Text style={styles.vipTitle}>VIP ile daha fazlası</Text>
          <Text style={styles.vipDesc}>Filigransız ve 1080p kalitesinde export al.</Text>
        </View>
        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.vipButton, pressed && styles.pressed]} onPress={() => router.push('/membership')}>
          <Text style={styles.vipButtonText}>Geçiş Yap</Text>
        </Pressable>
      </View>
    ) : null}

    <View style={styles.grid}>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.cell, styles.ghostFilled, pressed && styles.pressed]} onPress={onRetrySame}>
        <Feather name="refresh-cw" size={13} color="#d4d4d8" /><Text style={[styles.smallText, { color: '#d4d4d8' }]}>Aynı video ile dene</Text>
      </Pressable>
      <Pressable accessibilityRole="button" style={({ pressed }) => [styles.cell, styles.ghost, pressed && styles.pressed]} onPress={onNewVideo}>
        <Feather name="rotate-ccw" size={13} color={theme.muted} /><Text style={[styles.smallText, { color: theme.muted }]}>Yeni video</Text>
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { gap: 10, marginTop: 4 },
  title: { color: theme.text, fontSize: 16, fontWeight: '900' },
  description: { color: theme.muted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, borderRadius: 14, backgroundColor: theme.green },
  primaryText: { color: theme.background, fontWeight: '900', fontSize: 14 },
  share: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(166,255,63,0.25)', backgroundColor: 'rgba(166,255,63,0.1)' },
  shareText: { color: theme.green, fontWeight: '900', fontSize: 13, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { flexBasis: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 46, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1, borderColor: 'transparent' },
  cellText: { fontWeight: '900', fontSize: 12.5 },
  copy: { backgroundColor: 'rgba(255,255,255,0.1)' },
  x: { backgroundColor: 'rgba(14,165,233,0.2)' },
  tiktok: { backgroundColor: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.2)' },
  reels: { backgroundColor: 'rgba(217,70,239,0.1)', borderColor: 'rgba(217,70,239,0.2)' },
  vip: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(252,211,77,0.2)', backgroundColor: 'rgba(252,211,77,0.1)' },
  vipCopy: { flex: 1 },
  vipTitle: { color: '#fcd34d', fontWeight: '900', fontSize: 12.5 },
  vipDesc: { color: 'rgba(253,230,138,0.8)', fontSize: 11, marginTop: 2 },
  vipButton: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, backgroundColor: '#fcd34d' },
  vipButtonText: { color: '#000', fontWeight: '900', fontSize: 11 },
  ghostFilled: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', marginTop: 6 },
  ghost: { borderColor: 'rgba(255,255,255,0.1)', marginTop: 6 },
  smallText: { fontWeight: '800', fontSize: 11.5 },
  pressed: { opacity: 0.7 },
});
