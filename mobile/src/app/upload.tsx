import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActionButton, BrandHeader, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { absoluteApiUrl, api } from '@/lib/api';
import { notifyDubReady } from '@/lib/notifications';
import type { JobResponse, TimelineLine, UploadResponse, VoiceStyle } from '@/types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const newLine = (index: number, duration: number): TimelineLine => ({ id: `line-${Date.now()}-${index}`, start: index ? Math.min(duration, index * 2) : 0, end: Math.min(duration, (index + 1) * 2), text: '' });

function ResultVideo({ uri }: { uri: string }) {
  const resultPlayer = useVideoPlayer(absoluteApiUrl(uri));
  return <VideoView player={resultPlayer} style={styles.video} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />;
}

export default function UploadStudioScreen() {
  const { token, user } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 150);
  const alive = useRef(true);
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
  const player = useVideoPlayer(localUri);

  const validLines = useMemo(() => lines.length > 0 && lines.every((line) => line.text.trim() && line.start >= 0 && line.end > line.start && (!upload || line.end <= upload.duration_seconds + 0.05)), [lines, upload]);
  const allRecorded = useMemo(() => validLines && lines.every((line) => recordings[line.id]), [lines, recordings, validLines]);
  const ready = mode === 'ai' ? Boolean(validLines && token && user?.has_active_vip) : allRecorded;

  const pickVideo = useCallback(async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['video/mp4', 'video/quicktime', 'video/webm'], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    setBusy('Video güvenli biçimde yükleniyor…'); setError('');
    try {
      const next = await api.uploadFile(asset.uri, asset.name, asset.mimeType || 'video/mp4', token);
      setLocalUri(asset.uri); setUpload(next); setLines([newLine(0, next.duration_seconds)]); setRecordings({}); setJob(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Video yüklenemedi.'); }
    finally { setBusy(''); }
  }, [token]);

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
      setBusy(''); await notifyDubReady('Kendi videon');
    } catch (reason) { setBusy(''); setError(reason instanceof Error ? reason.message : 'Dublaj oluşturulamadı.'); }
  }, [lines, mode, options, ready, recordings, token, upload, voiceStyle]);

  return <Screen><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>← Sahneler</Text></Pressable>
    <BrandHeader eyebrow="Özel proje" title="Kendi videonu dublajla" />
    {!localUri ? <View style={styles.picker}><Text style={styles.pickerCopy}>MP4, MOV veya WebM videonu seç. Dosya boyutu ve süre sınırları sunucu kurallarına göre doğrulanır.</Text><ActionButton label={busy || 'Video seç'} disabled={Boolean(busy)} onPress={() => void pickVideo()} /></View> : <>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />
      <Pressable onPress={() => void pickVideo()}><Text style={styles.change}>Başka video seç</Text></Pressable>
      <Text style={styles.heading}>Ses yöntemi</Text><View style={styles.row}><Pressable style={[styles.choice, mode === 'recording' && styles.active]} onPress={() => setMode('recording')}><Text style={styles.choiceText}>Kendi sesim</Text></Pressable><Pressable style={[styles.choice, mode === 'ai' && styles.active]} onPress={() => { if (!token || !user?.has_active_vip) { Alert.alert('VIP gerekli', 'AI ses için giriş yapmış aktif VIP hesabı gerekir.'); return; } setMode('ai'); }}><Text style={styles.choiceText}>AI ses · VIP</Text></Pressable></View>
      {mode === 'ai' ? <View style={styles.row}>{(['announcer', 'robot', 'dramatic', 'documentary', 'energetic'] as VoiceStyle[]).map((voice) => <Pressable key={voice} style={[styles.voice, voiceStyle === voice && styles.active]} onPress={() => setVoiceStyle(voice)}><Text style={styles.voiceText}>{voice}</Text></Pressable>)}</View> : null}
      <Text style={styles.heading}>Zaman çizelgesi</Text>
      {lines.map((line, index) => <View key={line.id} style={styles.line}>
        <View style={styles.lineHead}><Text style={styles.lineLabel}>REPLİK {index + 1}</Text>{lines.length > 1 ? <Pressable onPress={() => setLines((current) => current.filter((item) => item.id !== line.id))}><Text style={styles.remove}>Sil</Text></Pressable> : null}</View>
        <TextInput value={line.text} onChangeText={(text) => updateLine(line.id, { text })} maxLength={500} multiline placeholder="Repliği yaz" placeholderTextColor={theme.muted} style={styles.input} />
        <View style={styles.row}><TextInput keyboardType="decimal-pad" value={String(line.start)} onChangeText={(value) => updateLine(line.id, { start: Number(value.replace(',', '.')) || 0 })} style={styles.time} /><Text style={styles.to}>–</Text><TextInput keyboardType="decimal-pad" value={String(line.end)} onChangeText={(value) => updateLine(line.id, { end: Number(value.replace(',', '.')) || 0 })} style={styles.time} /><Text style={styles.to}>sn</Text></View>
        {mode === 'recording' ? <Pressable style={[styles.record, activeLine === line.id && styles.recording]} onPress={() => void toggleRecording(line.id)}><Text style={styles.recordText}>{activeLine === line.id ? `Kaydı bitir · ${(recorderState.durationMillis / 1000).toFixed(1)} sn` : recordings[line.id] ? '✓ Tekrar kaydet' : 'Kayda başla'}</Text></Pressable> : null}
      </View>)}
      <Pressable style={styles.add} onPress={addLine}><Text style={styles.addText}>+ Replik ekle</Text></Pressable>
      <Text style={styles.heading}>Export ayarları</Text>
      {[{ key: 'muteOriginalAudio', label: 'Orijinal sesi kapat' }, { key: 'burnSubtitles', label: 'Altyazı göm' }, { key: 'applyLipSync', label: 'Lip-sync · VIP' }].map((item) => <View key={item.key} style={styles.setting}><Text style={styles.settingText}>{item.label}</Text><Switch value={options[item.key as keyof typeof options]} onValueChange={(value) => { if (item.key === 'applyLipSync' && value && !user?.has_active_vip) { Alert.alert('VIP gerekli'); return; } setOptions((current) => ({ ...current, [item.key]: value })); }} thumbColor={options[item.key as keyof typeof options] ? theme.green : theme.muted} /></View>)}
      {job?.status === 'completed' && job.download_url ? <ResultVideo uri={job.download_url} /> : null}
      <ActionButton label={busy || (ready ? 'Dublajı oluştur' : mode === 'ai' ? 'Metin, giriş ve VIP gerekli' : 'Metinleri yaz ve kayıtları tamamla')} disabled={!ready || Boolean(busy)} onPress={() => void create()} />
    </>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView></Screen>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 45 }, back: { color: theme.green, fontWeight: '900', paddingVertical: 8 }, picker: { padding: 20, gap: 16, backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border }, pickerCopy: { color: theme.muted, lineHeight: 22 }, video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 18, backgroundColor: '#000' }, change: { color: theme.purple, textAlign: 'center', fontWeight: '800', padding: 12 },
  heading: { color: theme.text, fontSize: 19, fontWeight: '900', marginTop: 20, marginBottom: 10 }, row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }, choice: { flex: 1, padding: 13, borderRadius: 13, alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, active: { borderColor: theme.green, backgroundColor: theme.greenDark }, choiceText: { color: theme.text, fontWeight: '900' }, voice: { padding: 10, borderRadius: 10, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, voiceText: { color: theme.text, fontSize: 11, fontWeight: '800' },
  line: { padding: 15, borderRadius: 17, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: 10 }, lineHead: { flexDirection: 'row', justifyContent: 'space-between' }, lineLabel: { color: theme.purple, fontSize: 11, fontWeight: '900' }, remove: { color: '#fda4af', fontWeight: '800' }, input: { minHeight: 65, color: theme.text, textAlignVertical: 'top', marginVertical: 10, padding: 11, borderRadius: 12, backgroundColor: theme.background }, time: { width: 72, color: theme.text, textAlign: 'center', padding: 10, borderRadius: 10, backgroundColor: theme.background }, to: { color: theme.muted }, record: { alignItems: 'center', marginTop: 11, padding: 12, borderRadius: 12, backgroundColor: theme.surfaceRaised }, recording: { backgroundColor: '#4c101d' }, recordText: { color: theme.text, fontWeight: '900' }, add: { alignItems: 'center', padding: 13, borderRadius: 13, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.green }, addText: { color: theme.green, fontWeight: '900' },
  setting: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 13, borderRadius: 13, backgroundColor: theme.surface, marginBottom: 8 }, settingText: { color: theme.text, fontWeight: '800' }, error: { color: '#fecdd3', backgroundColor: '#3f1019', borderRadius: 14, padding: 13, lineHeight: 20, marginTop: 12 },
});
