import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useVideoPlayer, VideoView } from 'expo-video';

import { ActionButton, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { absoluteApiUrl, api, templateMediaUrl } from '@/lib/api';
import type { JobResponse, VideoTemplate } from '@/types';

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

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
  const { token } = useAuth();
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
    if (!template || !allRecorded) return;
    setError('');
    setJob(null);
    try {
      setBusyMessage('Sahne hazırlanıyor…');
      const upload = await api.uploadTemplateVideo(template, token);
      setBusyMessage('Kayıtlar gönderiliyor…');
      let nextJob = await api.submitRecordings({
        videoId: upload.video_id,
        templateId: template.id,
        timeline: template.lines,
        recordings,
        token,
      });
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
    } catch (reason) {
      setBusyMessage('');
      setError(reason instanceof Error ? reason.message : 'Dublaj oluşturulamadı.');
    }
  }, [allRecorded, recordings, template, token]);

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

        <Text style={styles.sectionTitle}>Replik kayıtları</Text>
        {template.lines.map((line, index) => {
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
        })}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {busyMessage ? (
          <View style={styles.progressPanel}>
            <Text style={styles.progressText}>{busyMessage}</Text>
            <Text style={styles.progressValue}>%{job?.progress ?? 0}</Text>
          </View>
        ) : null}
        {!resultUrl ? (
          <ActionButton
            label={busyMessage || (allRecorded ? 'Dublajı oluştur' : `${template.lines.length - recordedCount} kayıt kaldı`)}
            disabled={!allRecorded || Boolean(busyMessage) || Boolean(activeLineId)}
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
});
