import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActionButton, BrandHeader, Screen } from '@/components/ui';
import { DubResultActions } from '@/components/DubResultActions';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { api, videoSource, voicePreviewUrl } from '@/lib/api';
import { notifyDubReady } from '@/lib/notifications';
import type { JobResponse, TimelineLine, UploadResponse, VoiceStyle } from '@/types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const newLine = (index: number, duration: number): TimelineLine => ({ id: `line-${Date.now()}-${index}`, start: index ? Math.min(duration, index * 2) : 0, end: Math.min(duration, (index + 1) * 2), text: '' });

function VoiceChoice({ styleId, label, selected, onSelect }: { styleId: VoiceStyle; label: string; selected: boolean; onSelect: () => void }) {
  const preview = useAudioPlayer(voicePreviewUrl(styleId));
  return <View style={[styles.voiceCard, selected && styles.voiceCardSelected]}>
    <Pressable style={styles.voiceSelect} onPress={onSelect}><Text style={styles.voiceChoiceText}>{selected ? '✓ ' : ''}{label}</Text></Pressable>
    <Pressable style={styles.voicePreview} onPress={() => { preview.seekTo(0); preview.play(); }}><Text style={styles.voicePreviewText}>▶ Dinle</Text></Pressable>
  </View>;
}

function formatTime(seconds: number) {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = Math.floor(safe % 60);
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function ResultVideo({ uri, token }: { uri: string; token?: string | null }) {
  const resultPlayer = useVideoPlayer(videoSource(uri, token));
  return <View>
    <VideoView player={resultPlayer} style={styles.video} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />
    <View style={styles.seekRow}>
      <Pressable style={styles.seekButton} onPress={() => resultPlayer.seekBy(-10)}><Text style={styles.seekText}>-10 sn</Text></Pressable>
      <View style={styles.seekStatus}><Text style={styles.seekStatusText}>{formatTime(resultPlayer.currentTime)} / {formatTime(resultPlayer.duration)}</Text></View>
      <Pressable style={styles.seekButton} onPress={() => resultPlayer.seekBy(10)}><Text style={styles.seekText}>+10 sn</Text></Pressable>
    </View>
  </View>;
}

export default function UploadStudioScreen() {
  const { token, user } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 150);
  const alive = useRef(true);
  const scrollViewRef = useRef<ScrollViewInstance>(null);
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [upload, setUpload] = useState<UploadResponse | null>(null);
  const [lines, setLines] = useState<TimelineLine[]>([]);
  const [recordings, setRecordings] = useState<Record<string, string>>({});
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [mode, setMode] = useState<'recording' | 'ai'>('recording');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('announcer');
  const [options, setOptions] = useState({ muteOriginalAudio: true, burnSubtitles: true, applyLipSync: false });
  const [job, setJob] = useState<JobResponse | null>(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [lastCompletedSignature, setLastCompletedSignature] = useState<string | null>(null);
  const player = useVideoPlayer(localUri);

  const validLines = useMemo(() => lines.length > 0 && lines.every((line) => line.text.trim() && line.start >= 0 && line.end > line.start && (!upload || line.end <= upload.duration_seconds + 0.05)), [lines, upload]);
  const allRecorded = useMemo(() => validLines && lines.every((line) => recordings[line.id]), [lines, recordings, validLines]);
  const currentSignature = useMemo(() => JSON.stringify({
    mode,
    voiceStyle,
    lines,
    recordingUris: mode === 'recording' ? lines.map((line) => recordings[line.id] || null) : null,
    aiText: mode === 'ai' ? lines.map((line) => line.text).join('\n') : null,
    options,
  }), [lines, mode, options, recordings, voiceStyle]);
  const ready = (mode === 'ai' ? Boolean(validLines && token && user?.has_active_vip) : allRecorded) && (job?.status !== 'completed' || currentSignature !== lastCompletedSignature);

  const pickVideo = useCallback(async () => {
    if (!rightsConfirmed) return;
    const picked = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime', 'video/webm'], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    setBusy('Video güvenli biçimde yükleniyor…'); setError('');
    try {
      const next = await api.uploadFile(asset.uri, asset.name, asset.mimeType || 'video/mp4', token);
      setLocalUri(asset.uri); setUpload(next); setLines([newLine(0, next.duration_seconds)]); setRecordings({}); setJob(null); setLastCompletedSignature(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Video yüklenemedi.'); }
    finally { setBusy(''); }
  }, [rightsConfirmed, token]);

  const updateLine = useCallback((id: string, update: Partial<TimelineLine>) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...update } : line)), []);
  const addLine = useCallback(() => { if (!upload) return; setLines((current) => [...current, newLine(current.length, upload.duration_seconds)]); }, [upload]);

  const toggleRecording = useCallback(async (id: string) => {
    if (activeLine === id) {
      await recorder.stop();
      if (recorder.uri) setRecordings((current) => ({ ...current, [id]: recorder.uri! }));
      setActiveLine(null); await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }); return;
    }
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) { Alert.alert('Mikrofon izni gerekli', 'Kendi sesini kaydetmek için mikrofon izni vermelisin.'); return; }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }); await recorder.prepareToRecordAsync(); recorder.record(); setActiveLine(id);
  }, [activeLine, recorder]);

  const create = useCallback(async () => {
    if (!upload || !ready) return;
    setBusy('Dublaj sıraya alınıyor…'); setError(''); setJob(null);
    try {
      let next = mode === 'ai'
        ? await api.submitAi({ videoId: upload.video_id, text: lines.map((line) => line.text).join(' '), voiceStyle, token: token!, options })
        : await api.submitRecordings({ videoId: upload.video_id, timeline: lines, recordings, token, options });
      setJob(next);
      for (let attempt = 0; attempt < 200 && !['completed', 'failed'].includes(next.status); attempt += 1) { await wait(1500); next = await api.job(next.job_id); if (!alive.current) return; setJob(next); setBusy(next.message); }
      if (next.status === 'failed') throw new Error(next.error || next.message);
      if (next.status !== 'completed') throw new Error('İşlem bekleme süresini aştı.');
      setLastCompletedSignature(currentSignature);
      setBusy(''); await notifyDubReady('Kendi videon');
      requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd({ animated: true }));
    } catch (reason) { setBusy(''); setError(reason instanceof Error ? reason.message : 'Dublaj oluşturulamadı.'); }
  }, [currentSignature, lines, mode, options, ready, recordings, token, upload, voiceStyle]);

  return <Screen><ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Sahneler</Text></Pressable>
    <BrandHeader eyebrow="Özel proje" title="Kendi videonu dublajla" />
    {!localUri ? <View style={styles.picker}>
      <Text style={styles.pickerCopy}>MP4, MOV veya WebM videonu seç. Dosya boyutu ve süre sınırları sunucu kurallarına göre doğrulanır. Yüklediğin video işlenmek üzere sunucuya gönderilir; saklama süresini Kütüphanem’de görebilirsin.</Text>
      <View style={styles.ethics}>
        <Text style={styles.ethicsTitle}>Yükleme öncesi güvenlik ve haklar</Text>
        <Text style={styles.pickerCopy}>Yalnızca kullanma hakkına sahip olduğun içerikleri yükle. Rıza dışı mahrem görüntüler, çocukların cinsel istismarı, gerçek kişileri yanıltıcı biçimde taklit eden veya kişisel verileri ihlal eden içerikleri yükleme ya da paylaşma. Uygunsuz topluluk içerikleri bildirilebilir.</Text>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: rightsConfirmed }} onPress={() => setRightsConfirmed((current) => !current)} style={styles.confirmRow}>
          <View style={[styles.checkbox, rightsConfirmed && styles.checkboxChecked]}><Text style={styles.checkboxText}>{rightsConfirmed ? '✓' : ''}</Text></View>
          <Text style={styles.confirmText}>Bu içerik için gerekli haklara sahibim ve kurallara uyacağım.</Text>
        </Pressable>
      </View>
      <ActionButton label={busy || 'Video seç'} disabled={Boolean(busy) || !rightsConfirmed} onPress={() => void pickVideo()} />
      <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'copyright' } })}><Text style={styles.legalLink}>Telif ve içerik kurallarını oku</Text></Pressable>
    </View> : <>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />
      <Pressable onPress={() => void pickVideo()}><Text style={styles.change}>Başka video seç</Text></Pressable>
      <Text style={styles.heading}>Ses yöntemi</Text><View style={styles.row}><Pressable style={[styles.choice, mode === 'recording' && styles.active]} onPress={() => setMode('recording')}><Text style={styles.choiceText}>Kendi sesim</Text></Pressable><Pressable style={[styles.choice, mode === 'ai' && styles.active]} onPress={() => { if (!token || !user?.has_active_vip) { Alert.alert('VIP gerekli', 'AI ses için giriş yapmış aktif VIP hesabı gerekir.'); return; } setMode('ai'); }}><Text style={styles.choiceText}>AI ses · VIP</Text></Pressable></View>
      {mode === 'ai' ? <View style={styles.voiceGrid}>{([
        ['announcer', 'Spiker'],
        ['robot', 'Robot'],
        ['dramatic', 'Dramatik'],
        ['documentary', 'Belgesel'],
        ['energetic', 'Enerjik'],
      ] as [VoiceStyle, string][]).map(([styleId, label]) => <VoiceChoice key={styleId} styleId={styleId} label={label} selected={voiceStyle === styleId} onSelect={() => setVoiceStyle(styleId)} />)}</View> : null}
      <Text style={styles.heading}>Zaman çizelgesi</Text>
      {lines.map((line, index) => <View key={line.id} style={styles.line}>
        <View style={styles.lineHead}><Text style={styles.lineLabel}>REPLİK {index + 1}</Text>{lines.length > 1 ? <Pressable onPress={() => setLines((current) => current.filter((item) => item.id !== line.id))}><Text style={styles.remove}>Sil</Text></Pressable> : null}</View>
        <TextInput value={line.text} onChangeText={(text) => updateLine(line.id, { text })} maxLength={500} multiline placeholder="Repliği yaz" placeholderTextColor={theme.muted} style={styles.input} />
        <View style={styles.row}><TextInput keyboardType="decimal-pad" value={String(line.start)} onChangeText={(value) => updateLine(line.id, { start: Number(value.replace(',', '.')) || 0 })} style={styles.time} /><Text style={styles.to}>–</Text><TextInput keyboardType="decimal-pad" value={String(line.end)} onChangeText={(value) => updateLine(line.id, { end: Number(value.replace(',', '.')) || 0 })} style={styles.time} /><Text style={styles.to}>sn</Text></View>
        {recordings[line.id] ? <Text style={styles.rangeText}>Bu ses videoda {formatTime(line.start)} – {formatTime(line.end)} arasında oynar.</Text> : null}
        {mode === 'recording' ? <Pressable style={[styles.record, activeLine === line.id && styles.recording]} onPress={() => void toggleRecording(line.id)}><Text style={styles.recordText}>{activeLine === line.id ? `Kaydı bitir · ${(recorderState.durationMillis / 1000).toFixed(1)} sn` : recordings[line.id] ? '✓ Tekrar kaydet' : 'Kayda başla'}</Text></Pressable> : null}
      </View>)}
      <Pressable style={styles.add} onPress={addLine}><Text style={styles.addText}>+ Replik ekle</Text></Pressable>
      <Text style={styles.heading}>Export ayarları</Text>
      {[{ key: 'muteOriginalAudio', label: 'Orijinal sesi kapat' }, { key: 'burnSubtitles', label: 'Altyazı göm' }, { key: 'applyLipSync', label: 'Lip-sync · VIP' }].map((item) => <View key={item.key} style={styles.setting}><Text style={styles.settingText}>{item.label}</Text><Switch value={options[item.key as keyof typeof options]} onValueChange={(value) => { if (item.key === 'applyLipSync' && value && !user?.has_active_vip) { Alert.alert('VIP gerekli'); return; } setOptions((current) => ({ ...current, [item.key]: value })); }} thumbColor={options[item.key as keyof typeof options] ? theme.green : theme.muted} /></View>)}
      {job?.status === 'completed' && job.download_url ? <View style={styles.resultBlock}>
        <Text style={styles.resultTitle}>Dublajın hazır</Text>
        <ResultVideo uri={job.download_url} token={token} />
        <DubResultActions
          downloadUrl={job.download_url}
          fileName={`dublajlab-${job.output_video_id || 'video'}.mp4`}
          token={token}
          hasVip={Boolean(user?.has_active_vip)}
          onRetrySame={() => { setJob(null); setLastCompletedSignature(null); requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })); }}
          onNewVideo={() => { setJob(null); setLastCompletedSignature(null); setLocalUri(null); setUpload(null); setLines([]); setRecordings({}); setError(''); requestAnimationFrame(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })); }}
        />
      </View> : null}
      <ActionButton label={busy || (job?.status === 'completed' && currentSignature === lastCompletedSignature ? 'Bu dublaj oluşturuldu · Değişiklik yapın' : ready ? 'Dublajı oluştur' : mode === 'ai' ? 'Metin, giriş ve VIP gerekli' : 'Metinleri yaz ve kayıtları tamamla')} disabled={!ready || Boolean(busy)} onPress={() => void create()} />
    </>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 45 }, back: { color: theme.green, fontWeight: '900', paddingVertical: 8 }, picker: { padding: 20, gap: 16, backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border }, pickerCopy: { color: theme.muted, lineHeight: 22 }, video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, backgroundColor: '#000' }, change: { color: theme.purple, textAlign: 'center', fontWeight: '800', padding: 12 },
  heading: { color: theme.text, fontSize: 19, fontWeight: '900', marginTop: 20, marginBottom: 10 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, choice: { flex: 1, padding: 13, borderRadius: 13, alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, active: { borderColor: theme.green, backgroundColor: theme.greenDark }, choiceText: { color: theme.text, fontWeight: '900' },
  ethics: { padding: 15, gap: 10, borderRadius: 16, backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border }, ethicsTitle: { color: theme.purple, fontWeight: '900' }, confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 5 }, checkbox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 7, borderWidth: 1, borderColor: theme.muted }, checkboxChecked: { backgroundColor: theme.green, borderColor: theme.green }, checkboxText: { color: theme.background, fontWeight: '900' }, confirmText: { flex: 1, color: theme.text, lineHeight: 19, fontSize: 13 }, legalLink: { color: theme.green, textAlign: 'center', fontWeight: '800', padding: 10 },
  line: { padding: 15, borderRadius: 17, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }, lineHead: { flexDirection: 'row', justifyContent: 'space-between' }, lineLabel: { color: theme.purple, fontSize: 11, fontWeight: '900' }, remove: { color: '#fda4af', fontWeight: '800' }, input: { minHeight: 65, color: theme.text, textAlignVertical: 'top', marginVertical: 10, padding: 11, borderRadius: 12, backgroundColor: theme.background }, time: { width: 72, color: theme.text, textAlign: 'center', padding: 10, borderRadius: 10, backgroundColor: theme.background }, to: { color: theme.muted }, record: { alignItems: 'center', marginTop: 11, padding: 12, borderRadius: 12, backgroundColor: theme.surfaceRaised }, recording: { backgroundColor: '#4c101d' }, recordText: { color: theme.text, fontWeight: '900' }, add: { alignItems: 'center', padding: 13, borderRadius: 13, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.green }, addText: { color: theme.green, fontWeight: '900' },
  setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 13, backgroundColor: theme.surface, marginBottom: 8 }, settingText: { color: theme.text, fontWeight: '800' }, error: { color: '#fecdd3', backgroundColor: '#3f1019', borderRadius: 14, padding: 13, lineHeight: 20, marginTop: 12 },
  voiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, voiceCard: { width: '48%', borderRadius: 13, overflow: 'hidden', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, voiceCardSelected: { borderColor: theme.green, backgroundColor: theme.greenDark }, voiceSelect: { padding: 12 }, voiceChoiceText: { color: theme.text, fontWeight: '900', fontSize: 13 }, voicePreview: { alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.surfaceRaised }, voicePreviewText: { color: theme.green, fontWeight: '900', fontSize: 12 },
  rangeText: { color: theme.green, fontSize: 12, lineHeight: 18, marginTop: 10 }, seekRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }, seekButton: { paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border }, seekText: { color: theme.text, fontWeight: '900', fontSize: 12 }, seekStatus: { flex: 1, alignItems: 'center' }, seekStatusText: { color: theme.muted, fontVariant: ['tabular-nums'], fontSize: 12 },
  resultBlock: { marginTop: 16, padding: 14, gap: 12, borderRadius: 18, borderWidth: 1, borderColor: theme.green, backgroundColor: theme.surface }, resultTitle: { color: theme.text, fontSize: 18, fontWeight: '900' },
});
