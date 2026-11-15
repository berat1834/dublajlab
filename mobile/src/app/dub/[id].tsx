import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActionButton, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { api, videoSource, WEB_BASE_URL } from '@/lib/api';
import type { DubComment, PublicDub } from '@/types';

function DubVideo({ uri, token }: { uri: string; token?: string | null }) {
  const player = useVideoPlayer(videoSource(uri, token));
  useEffect(() => { player.play(); }, [player]);
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />;
}

export default function DubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [dub, setDub] = useState<PublicDub | null>(null);
  const [comments, setComments] = useState<DubComment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportVisible, setReportVisible] = useState(false);
  const [reportReason, setReportReason] = useState('copyright');
  const [reportDetails, setReportDetails] = useState('');
  const [reporting, setReporting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      const [nextDub, nextComments] = await Promise.all([api.publicDub(id, token), api.publicDubComments(id, token)]);
      setDub(nextDub); setComments(nextComments); void api.viewDub(id);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Dublaj açılamadı.'); }
    finally { setLoading(false); }
  }, [id, token]);
  useEffect(() => {
    // Hydrate route data whenever the selected public dub changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const sendComment = useCallback(async () => {
    if (!id || !token || !body.trim()) return;
    try { const comment = await api.addComment(id, body.trim(), token); setComments((current) => [...current, comment]); setBody(''); }
    catch (reason) { Alert.alert('Yorum gönderilemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.'); }
  }, [body, id, token]);

  const submitReport = useCallback(async () => {
    if (!dub || reporting) return;
    setReporting(true);
    try {
      await api.reportDub(dub.project_id, reportReason, reportDetails.trim() || undefined, token);
      setReportVisible(false);
      setReportDetails('');
      Alert.alert('Teşekkürler', 'Bildirimin moderasyona gönderildi.');
    } catch (reason) {
      Alert.alert('Gönderilemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setReporting(false);
    }
  }, [dub, reportDetails, reportReason, reporting, token]);

  if (loading || !dub) return <Screen><Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></Pressable><EmptyState loading={loading} title={error ? 'Dublaj açılamadı' : undefined} message={error} actionLabel={error ? 'Tekrar dene' : undefined} onAction={error ? () => void load() : undefined} /></Screen>;

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Dublajlar</Text></Pressable>
    <Text style={styles.title}>{dub.title}</Text><Text style={styles.author}>@{dub.display_name}</Text>
    {dub.download_url ? <DubVideo uri={dub.download_url} token={token} /> : <Text style={styles.error}>Video artık mevcut değil.</Text>}
    <View style={styles.actions}>
      <Pressable style={styles.action} onPress={async () => { if (!token) { router.navigate('/account'); return; } const liking = !dub.liked_by_me; setDub({ ...dub, liked_by_me: liking, like_count: Math.max(0, dub.like_count + (liking ? 1 : -1)) }); try { await api.likeDub(dub.project_id, liking, token); } catch { Alert.alert('Beğeni güncellenemedi', 'Bağlantını kontrol edip tekrar dene.'); void load(); } }}><Text style={[styles.actionText, dub.liked_by_me && styles.liked]}>♥ {dub.like_count}</Text></Pressable>
      <Pressable style={styles.action} onPress={() => void Share.share({ title: dub.title, message: `${dub.title}\n${WEB_BASE_URL}/dublajlar?dub=${encodeURIComponent(dub.project_id)}` })}><Text style={styles.actionText}>Paylaş</Text></Pressable>
      <Pressable style={styles.action} onPress={() => setReportVisible(true)}><Text style={styles.report}>Bildir</Text></Pressable>
    </View>
    <Text style={styles.section}>Yorumlar</Text>
    {token ? <View style={styles.commentComposer}><TextInput value={body} onChangeText={setBody} maxLength={500} multiline placeholder="Yorum yaz…" placeholderTextColor={theme.muted} style={styles.input} /><ActionButton label="Gönder" disabled={!body.trim()} onPress={() => void sendComment()} /></View> : <Pressable onPress={() => router.navigate('/account')}><Text style={styles.loginHint}>Yorum yapmak ve beğenmek için giriş yap.</Text></Pressable>}
    {comments.map((comment) => <View key={comment.id} style={styles.comment}><View style={styles.commentHead}><Text style={styles.commentAuthor}>@{comment.display_name}</Text>{comment.is_mine && token ? <Pressable onPress={async () => { try { await api.deleteComment(dub.project_id, comment.id, token); setComments((current) => current.filter((item) => item.id !== comment.id)); } catch (reason) { Alert.alert('Yorum silinemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.'); } }}><Text style={styles.delete}>Sil</Text></Pressable> : null}</View><Text style={styles.commentBody}>{comment.body}</Text></View>)}
  </ScrollView>
  <Modal visible={reportVisible} transparent animationType="fade" onRequestClose={() => setReportVisible(false)}>
    <View style={styles.modalBackdrop}>
      <ScrollView style={styles.reportModal} contentContainerStyle={styles.reportContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>İçeriği bildir</Text>
        <Text style={styles.reportHint}>En uygun nedeni seç. Bildirim moderasyon için gönderilir.</Text>
        {[
          { key: 'copyright', label: 'Telif hakkı ihlali' },
          { key: 'inappropriate', label: 'Uygunsuz veya zararlı içerik' },
          { key: 'misleading', label: 'Yanıltıcı içerik veya kimliğe bürünme' },
          { key: 'personal_data', label: 'Kişisel veri veya gizlilik ihlali' },
          { key: 'other', label: 'Diğer' },
        ].map((item) => (
          <Pressable key={item.key} accessibilityRole="radio" accessibilityState={{ checked: reportReason === item.key }} onPress={() => setReportReason(item.key)} style={styles.reason}>
            <Text style={[styles.radio, reportReason === item.key && styles.radioSelected]}>{reportReason === item.key ? '●' : '○'}</Text>
            <Text style={styles.reasonLabel}>{item.label}</Text>
          </Pressable>
        ))}
        <TextInput value={reportDetails} onChangeText={setReportDetails} maxLength={1000} multiline placeholder="İstersen ayrıntı ekle" placeholderTextColor={theme.muted} style={styles.input} />
        <Pressable disabled={reporting} onPress={() => void submitReport()} style={[styles.submitReport, reporting && styles.disabled]}>
          {reporting ? <ActivityIndicator color={theme.background} /> : <Text style={styles.submitText}>Bildirimi gönder</Text>}
        </Pressable>
        <Pressable disabled={reporting} onPress={() => setReportVisible(false)} style={styles.cancelReport}><Text style={styles.cancelText}>Vazgeç</Text></Pressable>
      </ScrollView>
    </View>
  </Modal>
  </Screen>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 45 }, backButton: { margin: 20 }, back: { color: theme.green, fontWeight: '900', paddingVertical: 8 }, title: { color: theme.text, fontSize: 28, fontWeight: '900', marginTop: 8 }, author: { color: theme.purple, fontWeight: '800', marginTop: 5, marginBottom: 16 }, video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, backgroundColor: '#000' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 }, action: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 13, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, actionText: { color: theme.text, fontWeight: '900' }, liked: { color: '#fb7185' }, report: { color: '#fda4af', fontWeight: '900' },
  section: { color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 25, marginBottom: 12 }, commentComposer: { padding: 14, gap: 10, borderRadius: 17, backgroundColor: theme.surface, marginBottom: 12 }, input: { minHeight: 70, color: theme.text, textAlignVertical: 'top', padding: 12, borderRadius: 12, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border }, loginHint: { color: theme.green, padding: 14, borderRadius: 14, backgroundColor: theme.greenDark }, comment: { padding: 14, borderRadius: 15, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: 9 }, commentHead: { flexDirection: 'row', justifyContent: 'space-between' }, commentAuthor: { color: theme.purple, fontWeight: '800' }, commentBody: { color: theme.text, marginTop: 7, lineHeight: 20 }, delete: { color: '#fda4af', fontWeight: '800' }, error: { color: '#fda4af' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: '#000000cc' }, reportModal: { maxHeight: '90%', borderRadius: 22, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, reportContent: { padding: 20, gap: 10 }, reportHint: { color: theme.muted, lineHeight: 19, marginBottom: 4 }, reason: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, borderRadius: 12, backgroundColor: theme.surfaceRaised }, radio: { color: theme.muted, fontSize: 18 }, radioSelected: { color: theme.green }, reasonLabel: { color: theme.text, flex: 1 }, submitReport: { minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 4, borderRadius: 13, backgroundColor: theme.green }, submitText: { color: theme.background, fontWeight: '900' }, disabled: { opacity: 0.55 }, cancelReport: { alignItems: 'center', padding: 12 }, cancelText: { color: theme.muted, fontWeight: '800' },
});
