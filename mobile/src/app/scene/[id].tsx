import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActionButton, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { absoluteApiUrl, api, templateMediaUrl, voicePreviewUrl } from '@/lib/api';
import { notifyDubReady } from '@/lib/notifications';
import type { JobResponse, VideoTemplate, VoiceStyle } from '@/types';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const voiceStyles: { id: VoiceStyle; label: string }[] = [
  { id: 'announcer', label: 'Sunucu' }, { id: 'robot', label: 'Robot' },
  { id: 'dramatic', label: 'Dramatik' }, { id: 'documentary', label: 'Belgesel' },
  { id: 'energetic', label: 'Enerjik' },
];

function VoiceChoice({ item, selected, onSelect }: { item: { id: VoiceStyle; label: string }; selected: boolean; onSelect: () => void }) {
  const player = useAudioPlayer(voicePreviewUrl(item.id));
  return <View style={[styles.voiceCard, selected && styles.voiceCardSelected]}>
    <Pressable style={styles.voiceSelect} onPress={onSelect}><Text style={styles.voiceName}>{selected ? '✓ ' : ''}{item.label}</Text></Pressable>
    <Pressable accessibilityLabel={`${item.label} sesini dinle`} onPress={() => { void player.seekTo(0); player.play(); }}><Text style={styles.listen}>▶ Dinle</Text></Pressable>
  </View>;
}

function ResultVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return (
    <View style={styles.resultPanel}>
      <Text style={styles.resultTitle}>Dublajın hazır!</Text>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
      />
    </View>
  );
}

export default function SceneStudioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user, refreshUser } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 150);
  const mounted = useRef(true);
  const [template, setTemplate] = useState<VideoTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<Record<string, string>>({});
  const [job, setJob] = useState<JobResponse | null>(null);
  const [busyMessage, setBusyMessage] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'recording' | 'ai'>('recording');
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('announcer');
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(true);
  const [burnSubtitles, setBurnSubtitles] = useState(true);
  const [applyLipSync, setApplyLipSync] = useState(false);

  const videoUrl = template?.video_url ? templateMediaUrl(template.video_url) : null;
  const previewPlayer = useVideoPlayer(videoUrl);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadTemplate = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      setTemplate(await api.template(id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sahne yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // Fetch the route-specific scene when its id changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplate();
  }, [loadTemplate]);

  const recordedCount = useMemo(
    () => template?.lines.filter((line) => Boolean(recordings[line.id])).length ?? 0,
    [recordings, template],
  );
  const allRecorded = Boolean(template?.lines.length && recordedCount === template.lines.length);
  const canExport = mode === 'ai' ? Boolean(token && user?.has_active_vip) : allRecorded;

  const chooseAiMode = useCallback(async () => {
    if (!token) { Alert.alert('Giriş gerekli', 'AI ses modu hesabına bağlıdır.', [{ text: 'Tamam' }]); return; }
    const refreshed = await refreshUser();
    if (!refreshed?.has_active_vip) { Alert.alert('VIP gerekli', 'AI ses ve lip-sync yalnızca aktif VIP üyelikte kullanılabilir.'); return; }
    setMode('ai');
  }, [refreshUser, token]);

  const startRecording = useCallback(async (lineId: string) => {
    setError('');
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Mikrofon izni gerekli', 'Replik kaydetmek için mikrofon izni vermelisiniz.');
      return;
    }
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setActiveLineId(lineId);
  }, [recorder]);

  const stopRecording = useCallback(async () => {
    const lineId = activeLineId;
    if (!lineId) return;
    await recorder.stop();
    if (recorder.uri) {
      setRecordings((current) => ({ ...current, [lineId]: recorder.uri! }));
    }
    setActiveLineId(null);
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
  }, [activeLineId, recorder]);

  const exportDub = useCallback(async () => {
    if (!template || !canExport) return;
    setError('');
    setJob(null);
    try {
      setBusyMessage('Sahne hazırlanıyor…');
      const upload = await api.uploadTemplateVideo(template, token);
      setBusyMessage('Kayıtlar gönderiliyor…');
      let nextJob = mode === 'ai'
        ? await api.submitAi({ videoId: upload.video_id, templateId: template.id, text: template.lines.map((line) => line.text).join(' '), voiceStyle, token: token!, options: { muteOriginalAudio, burnSubtitles, applyLipSync } })
        : await api.submitRecordings({ videoId: upload.video_id, templateId: template.id, timeline: template.lines, recordings, token, options: { muteOriginalAudio, burnSubtitles, applyLipSync } });
      setJob(nextJob);
      setBusyMessage(nextJob.message || 'Dublaj işleniyor…');

      for (let attempt = 0; attempt < 200; attempt += 1) {
        if (nextJob.status === 'completed') break;
        if (nextJob.status === 'failed') {
          throw new Error(nextJob.error || nextJob.message || 'Dublaj tamamlanamadı.');
        }
        await delay(1500);
        nextJob = await api.job(nextJob.job_id);
        if (!mounted.current) return;
        setJob(nextJob);
        setBusyMessage(nextJob.message || 'Dublaj işleniyor…');
      }
      if (nextJob.status !== 'completed') throw new Error('İşlem bekleme süresini aştı.');
      setBusyMessage('');
      await notifyDubReady(template.title);
    } catch (reason) {
      setBusyMessage('');
      setError(reason instanceof Error ? reason.message : 'Dublaj oluşturulamadı.');
    }
  }, [applyLipSync, burnSubtitles, canExport, mode, muteOriginalAudio, recordings, template, token, voiceStyle]);

  if (loading || !template) {
    return (
      <Screen>
        <View style={styles.topBar}><Pressable onPress={() => router.back()}><Text style={styles.back}>← Geri</Text></Pressable></View>
        <EmptyState loading={loading} message={error || 'Sahne bulunamadı.'} />
      </Screen>
    );
  }

  const resultUrl = job?.status === 'completed' && job.download_url
    ? absoluteApiUrl(job.download_url)
    : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>← Sahneler</Text></Pressable>
          <Text style={styles.counter}>{recordedCount}/{template.lines.length} kayıt</Text>
        </View>

        <Text style={styles.eyebrow}>{template.category}</Text>
        <Text style={styles.heading}>{template.title}</Text>
        <Text style={styles.description}>{template.description}</Text>

        {videoUrl ? (
          <VideoView
            player={previewPlayer}
            style={styles.video}
            nativeControls
            contentFit="contain"
            fullscreenOptions={{ enable: true }}
          />
        ) : null}

        <View style={styles.tip}>
          <Text style={styles.tipTitle}>Nasıl çalışır?</Text>
          <Text style={styles.tipText}>Videoyu izle, her repliği kendi zaman aralığına uygun uzunlukta oku ve kaydı bitir.</Text>
        </View>

        <Text style={styles.sectionTitle}>Ses yöntemi</Text>
        <View style={styles.modeRow}>
          <Pressable style={[styles.modeButton, mode === 'recording' && styles.modeActive]} onPress={() => setMode('recording')}><Text style={styles.modeText}>Kendi sesim</Text></Pressable>
          <Pressable style={[styles.modeButton, mode === 'ai' && styles.modeActive]} onPress={() => void chooseAiMode()}><Text style={styles.modeText}>AI ses · VIP</Text></Pressable>
        </View>
        {mode === 'ai' ? <View style={styles.voiceGrid}>{voiceStyles.map((item) => <VoiceChoice key={item.id} item={item} selected={voiceStyle === item.id} onSelect={() => setVoiceStyle(item.id)} />)}</View> : null}

        {mode === 'recording' ? <Text style={styles.sectionTitle}>Replik kayıtları</Text> : null}
        {mode === 'recording' ? template.lines.map((line, index) => {
          const isActive = activeLineId === line.id;
          const isRecorded = Boolean(recordings[line.id]);
          return (
            <View key={line.id} style={[styles.lineCard, isActive && styles.lineCardActive]}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineNumber}>REPLİK {index + 1}</Text>
                <Text style={styles.lineTime}>{line.start.toFixed(1)}–{line.end.toFixed(1)} sn</Text>
              </View>
              <Text style={styles.lineText}>{line.text}</Text>
              {isActive ? (
                <Text style={styles.recordingTime}>● Kaydediliyor · {(recorderState.durationMillis / 1000).toFixed(1)} sn</Text>
              ) : isRecorded ? (
                <Text style={styles.saved}>✓ Kayıt hazır</Text>
              ) : null}
              <Pressable
                disabled={Boolean(activeLineId && !isActive) || Boolean(busyMessage)}
                onPress={() => void (isActive ? stopRecording() : startRecording(line.id))}
                style={({ pressed }) => [styles.recordButton, isActive && styles.stopButton, pressed && styles.pressed]}>
                <Text style={[styles.recordButtonText, isActive && styles.stopButtonText]}>
                  {isActive ? 'Kaydı bitir' : isRecorded ? 'Tekrar kaydet' : 'Kayda başla'}
                </Text>
              </Pressable>
            </View>
          );
        }) : null}

        <Text style={styles.sectionTitle}>Export ayarları</Text>
        <View style={styles.settingsPanel}>
          <View style={styles.setting}><View style={styles.settingCopy}><Text style={styles.settingTitle}>Orijinal sesi kapat</Text><Text style={styles.settingHint}>Dublajın net duyulmasını sağlar.</Text></View><Switch value={muteOriginalAudio} onValueChange={setMuteOriginalAudio} trackColor={{ true: theme.greenDark }} thumbColor={muteOriginalAudio ? theme.green : theme.muted} /></View>
          <View style={styles.setting}><View style={styles.settingCopy}><Text style={styles.settingTitle}>Altyazı göm</Text><Text style={styles.settingHint}>Replikler yalnızca kendi zaman aralığında görünür.</Text></View><Switch value={burnSubtitles} onValueChange={setBurnSubtitles} trackColor={{ true: theme.greenDark }} thumbColor={burnSubtitles ? theme.green : theme.muted} /></View>
          <View style={styles.setting}><View style={styles.settingCopy}><Text style={styles.settingTitle}>Lip-sync · VIP</Text><Text style={styles.settingHint}>Aktif VIP üyelik gerektirir.</Text></View><Switch value={applyLipSync} onValueChange={(value) => { if (value && !user?.has_active_vip) { Alert.alert('VIP gerekli', 'Lip-sync yalnızca aktif VIP üyelikte kullanılabilir.'); return; } setApplyLipSync(value); }} trackColor={{ true: theme.greenDark }} thumbColor={applyLipSync ? theme.green : theme.muted} /></View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {busyMessage ? (
          <View style={styles.progressPanel}>
            <Text style={styles.progressText}>{busyMessage}</Text>
            <Text style={styles.progressValue}>%{job?.progress ?? 0}</Text>
          </View>
        ) : null}
        {!resultUrl ? (
          <ActionButton
            label={busyMessage || (canExport ? 'Dublajı oluştur' : mode === 'ai' ? 'VIP ve giriş gerekli' : `${template.lines.length - recordedCount} kayıt kaldı`)}
            disabled={!canExport || Boolean(busyMessage) || Boolean(activeLineId)}
            onPress={() => void exportDub()}
          />
        ) : (
          <ResultVideo uri={resultUrl} />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 45 },
  topBar: { minHeight: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: theme.green, fontWeight: '900', paddingVertical: 8 },
  counter: { color: theme.muted, fontWeight: '700' },
  eyebrow: { color: theme.green, fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 10 },
  heading: { color: theme.text, fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 5 },
  description: { color: theme.muted, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 18 },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 20, backgroundColor: '#000', overflow: 'hidden' },
  tip: { padding: 16, borderRadius: 17, backgroundColor: theme.greenDark, borderWidth: 1, borderColor: '#426715', marginTop: 16 },
  tipTitle: { color: theme.green, fontWeight: '900', marginBottom: 5 },
  tipText: { color: '#d9f99d', lineHeight: 20 },
  sectionTitle: { color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 25, marginBottom: 12 },
  lineCard: { padding: 17, borderRadius: 19, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, marginBottom: 11 },
  lineCardActive: { borderColor: theme.danger },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  lineNumber: { color: theme.purple, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  lineTime: { color: theme.muted, fontSize: 12, fontWeight: '700' },
  lineText: { color: theme.text, fontSize: 17, lineHeight: 24, fontWeight: '700', marginVertical: 13 },
  recordingTime: { color: theme.danger, fontWeight: '800', marginBottom: 10 },
  saved: { color: theme.green, fontWeight: '800', marginBottom: 10 },
  recordButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border },
  stopButton: { backgroundColor: '#4c101d', borderColor: theme.danger },
  recordButtonText: { color: theme.text, fontWeight: '900' },
  stopButtonText: { color: '#fecdd3' },
  pressed: { opacity: 0.7 },
  error: { color: '#fecdd3', backgroundColor: '#3f1019', borderRadius: 14, padding: 13, lineHeight: 20, marginBottom: 12 },
  progressPanel: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: theme.surfaceRaised, borderRadius: 16, marginBottom: 12 },
  progressText: { color: theme.text, flex: 1, fontWeight: '700' },
  progressValue: { color: theme.green, fontWeight: '900' },
  resultPanel: { gap: 13, padding: 16, backgroundColor: theme.greenDark, borderRadius: 20 },
  resultTitle: { color: theme.green, fontSize: 22, fontWeight: '900' },
  modeRow: { flexDirection: 'row', gap: 9, marginBottom: 12 },
  modeButton: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center', backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  modeActive: { backgroundColor: theme.greenDark, borderColor: theme.green }, modeText: { color: theme.text, fontWeight: '900' },
  voiceGrid: { gap: 8, marginBottom: 8 }, voiceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border }, voiceCardSelected: { borderColor: theme.green }, voiceSelect: { flex: 1, padding: 14 }, voiceName: { color: theme.text, fontWeight: '800' }, listen: { color: theme.purple, padding: 14, fontWeight: '900' },
  settingsPanel: { backgroundColor: theme.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 15, marginBottom: 14 }, setting: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border }, settingCopy: { flex: 1, paddingRight: 12 }, settingTitle: { color: theme.text, fontWeight: '800' }, settingHint: { color: theme.muted, fontSize: 12, marginTop: 3 },
});
