import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandHeader, EmptyState, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { api } from '@/lib/api';
import type { VideoTemplate } from '@/types';

type SortMode = 'popular' | 'short';

export default function ScenesScreen() {
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('popular');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // useCallback prevents a new request callback on every render.
  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setTemplates(await api.templates());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sahneler alınamadı.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial remote-data hydration is intentionally performed once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplates();
  }, [loadTemplates]);

  // useMemo recalculates the filtered order only when its inputs change.
  const visibleTemplates = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('tr-TR');
    return templates
      .filter((item) => `${item.title} ${item.category}`.toLocaleLowerCase('tr-TR').includes(normalized))
      .sort((a, b) => sort === 'short'
        ? a.duration_seconds - b.duration_seconds
        : (b.play_count ?? 0) - (a.play_count ?? 0));
  }, [query, sort, templates]);

  return (
    <Screen>
      <FlatList
        data={visibleTemplates}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTemplates} tintColor={theme.green} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <BrandHeader eyebrow="DublajLab Mobile" title="Sahneni seç" />
            <Text style={styles.lead}>Hazır bir sahne seç, repliklerini kaydet ve kendi dublajını oluştur.</Text>
            <TextInput
              accessibilityLabel="Sahne ara"
              value={query}
              onChangeText={setQuery}
              placeholder="Sahne veya kategori ara"
              placeholderTextColor={theme.muted}
              style={styles.search}
            />
            <View style={styles.sortRow}>
              {(['popular', 'short'] as const).map((mode) => (
                <Pressable key={mode} onPress={() => setSort(mode)} style={[styles.pill, sort === mode && styles.pillActive]}>
                  <Text style={[styles.pillText, sort === mode && styles.pillTextActive]}>
                    {mode === 'popular' ? 'Popüler' : 'En kısa'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            loading={loading}
            icon="⌕"
            title={error ? 'Sahneler yüklenemedi' : 'Sonuç bulunamadı'}
            message={error || 'Aramana uygun sahne bulunamadı. Farklı bir kelime deneyebilirsin.'}
            actionLabel={error ? 'Tekrar dene' : query ? 'Aramayı temizle' : undefined}
            onAction={error ? () => void loadTemplates() : query ? () => setQuery('') : undefined}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/scene/[id]', params: { id: item.id } })}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
            <View style={styles.cardTop}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.duration}>{item.duration_seconds.toFixed(0)} sn</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{item.lines.length} replik</Text>
              <Text style={styles.meta}>{item.play_count ?? 0} oynatma</Text>
            </View>
            <Text style={styles.open}>Sahneyi aç  →</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 30 },
  lead: { color: theme.muted, fontSize: 15, lineHeight: 22, paddingHorizontal: 20, marginBottom: 16 },
  search: { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, borderRadius: 16, minHeight: 52, marginHorizontal: 20, paddingHorizontal: 16, fontSize: 15 },
  sortRow: { flexDirection: 'row', gap: 9, padding: 14, paddingHorizontal: 20 },
  pill: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 999, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  pillActive: { backgroundColor: theme.greenDark, borderColor: theme.green },
  pillText: { color: theme.muted, fontWeight: '700' },
  pillTextActive: { color: theme.green },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 18, borderRadius: 20, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
  cardPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  category: { color: theme.green, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  duration: { color: theme.muted, fontWeight: '700' },
  cardTitle: { color: theme.text, fontSize: 20, fontWeight: '900', marginBottom: 7 },
  description: { color: theme.muted, lineHeight: 21 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 15 },
  meta: { color: '#cbd5e1', fontSize: 12, fontWeight: '700' },
  open: { color: theme.green, fontWeight: '900', marginTop: 16 },
});
