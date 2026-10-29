import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';

import { ActionButton, BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { PublicDub } from '@/types';

export default function CommunityScreen() {
  const { token } = useAuth();
  const [dubs, setDubs] = useState<PublicDub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDubs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDubs(await api.publicDubs(token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Dublajlar alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    // Initial remote-data hydration is intentionally performed on dependency change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDubs();
  }, [loadDubs]);

  const totalReactions = useMemo(
    () => dubs.reduce((sum, dub) => sum + dub.like_count, 0),
    [dubs],
  );

  return (
    <Screen>
      <FlatList
        data={dubs}
        keyExtractor={(item) => item.project_id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadDubs} tintColor={theme.green} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <BrandHeader eyebrow="Topluluk" title="Yeni dublajlar" />
            <View style={styles.summary}>
              <Text style={styles.summaryNumber}>{dubs.length}</Text>
              <Text style={styles.summaryLabel}>yayınlanan dublaj</Text>
              <Text style={styles.summaryNumber}>{totalReactions}</Text>
              <Text style={styles.summaryLabel}>toplam beğeni</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            loading={loading}
            icon="♫"
            title={error ? 'Dublajlar yüklenemedi' : 'İlk dublajı sen yayınla'}
            message={error || 'Toplulukta henüz yayınlanmış bir dublaj yok. Bir sahne seçip kayda başlayabilirsin.'}
            actionLabel={error ? 'Tekrar dene' : 'Sahnelere git'}
            onAction={error ? () => void loadDubs() : () => router.navigate('/')}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>@{item.display_name}</Text>
            <View style={styles.reactionRow}>
              <Text style={styles.stats}>▶ {item.view_count}</Text>
              <Pressable
                disabled={!token}
                accessibilityLabel={item.liked_by_me ? 'Beğeniyi kaldır' : 'Beğen'}
                onPress={async () => {
                  if (!token) return;
                  const liking = !item.liked_by_me;
                  setDubs((current) => current.map((dub) => dub.project_id === item.project_id ? { ...dub, liked_by_me: liking, like_count: Math.max(0, dub.like_count + (liking ? 1 : -1)) } : dub));
                  try { await api.likeDub(item.project_id, liking, token); } catch { void loadDubs(); }
                }}>
                <Text style={[styles.like, item.liked_by_me && styles.liked]}>♥ {item.like_count}</Text>
              </Pressable>
            </View>
            <ActionButton label="İzle, yorumla ve paylaş" onPress={() => router.push({ pathname: '/dub/[id]', params: { id: item.project_id } } as unknown as Href)} />
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  summary: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 7, marginHorizontal: 20, marginBottom: 18, padding: 16, borderRadius: 18, backgroundColor: theme.greenDark },
  summaryNumber: { color: theme.green, fontSize: 21, fontWeight: '900' },
  summaryLabel: { color: '#d9f99d', marginRight: 10 },
  card: { marginHorizontal: 20, marginBottom: 12, gap: 10, padding: 18, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  title: { color: theme.text, fontSize: 19, fontWeight: '900' },
  author: { color: theme.purple, fontWeight: '700' },
  stats: { color: theme.muted, marginBottom: 4 },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  like: { color: theme.muted, fontWeight: '900', paddingVertical: 7 },
  liked: { color: '#fb7185' },
});
