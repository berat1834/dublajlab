import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { ActionButton, BrandHeader, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { EngagementProgress } from '@/types';

const taskLabels: Record<string, string> = {
  complete_dub: 'Bir dublaj tamamla',
  explore_scenes: 'İki farklı sahne keşfet',
  give_feedback: 'Topluluğa yorum yap',
};

const achievementLabels: Record<string, string> = {
  first_dub: 'İlk dublaj',
  scene_explorer: 'Sahne kaşifi',
  helpful_voice: 'Yardımsever ses',
  three_day_streak: 'Üç günlük seri',
};

export default function DailyScreen() {
  const { user, token } = useAuth();
  const [progress, setProgress] = useState<EngagementProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProgress = useCallback(async () => {
    if (!token) {
      setProgress(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setProgress(await api.engagement(token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'İlerleme bilgisi alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadProgress();
  }, [loadProgress]));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadProgress()} tintColor={theme.green} />}>
        <BrandHeader eyebrow="Günün Dublajı" title="Her gün biraz daha iyi" />
        {user && progress ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}><Text style={styles.statValue}>{progress.current_streak}</Text><Text style={styles.statLabel}>günlük seri</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{progress.today_xp}</Text><Text style={styles.statLabel}>bugünkü XP</Text></View>
              <View style={styles.stat}><Text style={styles.statValue}>{progress.longest_streak}</Text><Text style={styles.statLabel}>en uzun seri</Text></View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Günlük görevler</Text>
              <Text style={styles.copy}>İlerleme gerçek dublaj ve topluluk etkinliklerinden hesaplanır.</Text>
              {progress.tasks.map((task) => (
                <View key={task.key} style={styles.row}>
                  <Text style={[styles.mark, task.completed && styles.complete]}>{task.completed ? '✓' : '○'}</Text>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{taskLabels[task.key] ?? task.key}</Text>
                    <Text style={styles.rowMeta}>{Math.min(task.progress, task.target)}/{task.target} · +{task.xp} XP</Text>
                  </View>
                </View>
              ))}
              <View style={styles.bonus}>
                <Text style={styles.bonusTitle}>Günün tamamlanma bonusu</Text>
                <Text style={styles.copy}>{progress.all_tasks_completed ? 'Bugünkü tüm görevler tamamlandı.' : 'Tüm günlük görevleri bitirerek bonus XP kazan.'}</Text>
                <Text style={styles.bonusXp}>+{progress.daily_bonus_xp ?? 100} XP</Text>
              </View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Başarımlar</Text>
              {(progress.achievements ?? []).map((achievement) => (
                <View key={achievement.key} style={styles.row}>
                  <Text style={[styles.mark, achievement.unlocked && styles.complete]}>{achievement.unlocked ? '★' : '◇'}</Text>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{achievementLabels[achievement.key] ?? achievement.key.replaceAll('_', ' ')}</Text>
                    <Text style={styles.rowMeta}>{Math.min(achievement.progress, achievement.target)}/{achievement.target}</Text>
                  </View>
                  <Text style={achievement.unlocked ? styles.unlocked : styles.locked}>{achievement.unlocked ? 'Açıldı' : 'Kilitli'}</Text>
                </View>
              ))}
            </View>
          </>
        ) : user ? (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>{error ? 'İlerleme yüklenemedi' : 'İlerlemen yükleniyor'}</Text>
            {error ? <Text style={styles.copy}>{error}</Text> : null}
            {error ? <ActionButton label="Tekrar dene" onPress={() => void loadProgress()} /> : null}
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Seri, XP ve başarımlar</Text>
            <Text style={styles.copy}>Günlük ilerleme, dublaj ve yorum etkinliklerinden hesaplanır. Kendi ilerlemeni görmek için hesabına giriş yap.</Text>
            <ActionButton label="Giriş yap" onPress={() => router.navigate('/account')} />
          </View>
        )}

        <View style={styles.demo}>
          <Text style={styles.demoBadge}>DEMO İÇERİK</Text>
          <Text style={styles.demoTitle}>Toplantı faciası (Demo)</Text>
          <Text style={styles.quote}>“Tüm gün süren o toplantı beş dakika sürecek dediler... Sonra herkes kahve molasına çıktı ama mikrofonum açık kalmış!”</Text>
          <Text style={styles.attribution}>Seslendiren: EfsaneKral · Bu örnek gerçek bir yarışma sonucu değildir.</Text>
          <View style={styles.actions}>
            <ActionButton label="Sen de seslendir" onPress={() => router.push('/upload')} />
            <Pressable onPress={() => router.navigate('/community')} style={styles.secondary}>
              <Text style={styles.secondaryText}>Tüm dublajlar</Text>
            </Pressable>
            <Pressable onPress={() => router.navigate('/')} style={styles.secondary}>
              <Text style={styles.secondaryText}>Sahnelere git</Text>
            </Pressable>
          </View>
        </View>
        <Text style={styles.notice}>Günün Dublajı alanındaki örnek içerik tasarım demosudur; topluluk yarışması veya gerçek kazanan göstermez.</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  stats: { flexDirection: 'row', gap: 8, marginHorizontal: 20, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: theme.greenDark, borderWidth: 1, borderColor: '#426715' },
  statValue: { color: theme.green, fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#d9f99d', fontSize: 10, textAlign: 'center', marginTop: 4 },
  panel: { marginHorizontal: 20, marginBottom: 14, padding: 18, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, gap: 12 },
  sectionTitle: { color: theme.text, fontSize: 19, fontWeight: '900' },
  copy: { color: theme.muted, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.border },
  mark: { color: theme.muted, fontSize: 22, fontWeight: '900', width: 25, textAlign: 'center' },
  complete: { color: theme.green },
  rowCopy: { flex: 1 },
  rowTitle: { color: theme.text, fontWeight: '800' },
  rowMeta: { color: theme.muted, fontSize: 12, marginTop: 4 },
  bonus: { padding: 13, borderRadius: 14, backgroundColor: theme.greenDark, gap: 4 },
  bonusTitle: { color: theme.text, fontWeight: '900' },
  bonusXp: { color: theme.green, fontSize: 16, fontWeight: '900', marginTop: 3 },
  unlocked: { color: theme.green, fontSize: 11, fontWeight: '900' },
  locked: { color: theme.muted, fontSize: 11, fontWeight: '800' },
  demo: { marginHorizontal: 20, marginTop: 8, padding: 20, borderRadius: 20, backgroundColor: '#15151d', borderWidth: 1, borderColor: '#393044', gap: 12 },
  demoBadge: { color: '#c4b5fd', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  demoTitle: { color: theme.text, fontSize: 22, fontWeight: '900' },
  quote: { color: '#d4d4d8', lineHeight: 22 },
  attribution: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  actions: { gap: 9, marginTop: 5 },
  secondary: { alignItems: 'center', minHeight: 48, justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surfaceRaised },
  secondaryText: { color: theme.text, fontWeight: '800' },
  notice: { color: theme.muted, fontSize: 12, lineHeight: 18, marginHorizontal: 20, marginTop: 7 },
});
