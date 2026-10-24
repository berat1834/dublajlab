import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, RefreshControl, StyleSheet, Text, View } from 'react-native';

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
        ListEmptyComponent={<EmptyState loading={loading} message={error || 'Henüz yayınlanmış dublaj yok.'} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.author}>@{item.display_name}</Text>
            <Text style={styles.stats}>▶ {item.view_count}   ♥ {item.like_count}</Text>
            {item.download_url ? (
              <ActionButton label="Videoyu aç" onPress={() => void Linking.openURL(item.download_url!)} />
            ) : null}
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
});
