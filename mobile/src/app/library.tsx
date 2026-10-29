import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';

import { BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { absoluteApiUrl, api } from '@/lib/api';
import type { DubbingExport, DubbingProject } from '@/types';

function ProjectVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(absoluteApiUrl(uri));
  return <VideoView player={player} style={styles.video} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} />;
}

export default function LibraryScreen() {
  const { user, token } = useAuth();
  const [projects, setProjects] = useState<DubbingProject[]>([]);
  const [exports, setExports] = useState<DubbingExport[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const exportsByProject = useMemo(() => new Map(exports.map((item) => [item.project_id, item])), [exports]);
  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const [nextProjects, nextExports] = await Promise.all([api.projects(token), api.exports(token)]);
      setProjects(nextProjects); setExports(nextExports);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Kütüphane yüklenemedi.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    // Refresh account-owned projects after native session changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toggleVisibility = useCallback(async (project: DubbingProject) => {
    if (!token) return;
    const visibility = project.visibility === 'public' ? 'private' : 'public';
    try {
      const updated = await api.updateProject(project.id, { visibility }, token);
      setProjects((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) { Alert.alert('Yayın durumu değişmedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.'); }
  }, [token]);

  const remove = useCallback((project: DubbingProject) => {
    if (!token) return;
    Alert.alert('Projeyi sil', 'Video ve proje kalıcı olarak silinecek. Devam edilsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await api.deleteProject(project.id, token); setProjects((current) => current.filter((item) => item.id !== project.id)); }
        catch (reason) { Alert.alert('Silinemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.'); }
      } },
    ]);
  }, [token]);

  if (!user) return <Screen><EmptyState loading={false} icon="🔒" title="Kütüphane için giriş yap" message="Kaydedilen videoların, yayın ayarların ve indirmelerin hesabına bağlıdır." actionLabel="Hesabıma git" onAction={() => router.navigate('/account')} /></Screen>;

  return (
    <Screen>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.green} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<BrandHeader eyebrow="Projelerim" title="Dublaj kütüphanem" />}
        ListEmptyComponent={<EmptyState loading={loading} title={error ? 'Kütüphane açılamadı' : 'Henüz projen yok'} message={error || 'Bir sahne seçip ilk dublajını oluştur.'} actionLabel={error ? 'Tekrar dene' : 'Sahnelere git'} onAction={error ? () => void load() : () => router.navigate('/')} />}
        renderItem={({ item }) => {
          const output = exportsByProject.get(item.id);
          const playable = output?.download_url || null;
          const isExpanded = expanded === item.id;
          return <View style={styles.card}>
            <View style={styles.row}><View style={styles.flex}><Text style={styles.title}>{item.title}</Text><Text style={styles.meta}>{item.status} · {item.source_type === 'template' ? 'Hazır sahne' : 'Yüklenen video'}</Text></View><Text style={item.visibility === 'public' ? styles.public : styles.private}>{item.visibility === 'public' ? 'Herkese açık' : 'Gizli'}</Text></View>
            {playable && isExpanded ? <ProjectVideo uri={playable} /> : null}
            {!playable && item.status === 'completed' ? <Text style={styles.warning}>Video saklama süresi dolmuş veya dosya artık mevcut değil.</Text> : null}
            <View style={styles.actions}>
              {playable ? <Pressable style={styles.smallButton} onPress={() => setExpanded(isExpanded ? null : item.id)}><Text style={styles.smallText}>{isExpanded ? 'Kapat' : 'Oynat'}</Text></Pressable> : null}
              <Pressable style={styles.smallButton} onPress={() => void toggleVisibility(item)}><Text style={styles.smallText}>{item.visibility === 'public' ? 'Gizle' : 'Yayınla'}</Text></Pressable>
              <Pressable style={[styles.smallButton, styles.delete]} onPress={() => remove(item)}><Text style={styles.deleteText}>Sil</Text></Pressable>
            </View>
          </View>;
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 34 }, card: { marginHorizontal: 20, marginBottom: 12, padding: 16, gap: 12, backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' }, flex: { flex: 1 }, title: { color: theme.text, fontWeight: '900', fontSize: 17 }, meta: { color: theme.muted, marginTop: 5, fontSize: 12 },
  public: { color: theme.green, fontSize: 11, fontWeight: '900' }, private: { color: theme.muted, fontSize: 11, fontWeight: '900' }, video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 14 },
  warning: { color: '#fbbf24', lineHeight: 19 }, actions: { flexDirection: 'row', gap: 8 }, smallButton: { flex: 1, alignItems: 'center', padding: 11, borderRadius: 12, backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border }, smallText: { color: theme.text, fontWeight: '800' }, delete: { borderColor: '#7f1d1d' }, deleteText: { color: '#fda4af', fontWeight: '800' },
});
