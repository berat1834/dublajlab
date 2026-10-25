import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { ActionButton, BrandHeader, Screen } from '@/components/ui';
import { theme } from '@/constants/app-theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { EngagementProgress } from '@/types';

const taskLabels: Record<string, string> = {
  complete_dub: 'Bir dublaj tamamla',
  explore_scenes: 'Sahneleri keşfet',
  give_feedback: 'Topluluğa katkı ver',
};

const discordAuthEnabled = process.env.EXPO_PUBLIC_DISCORD_AUTH_ENABLED === 'true';

export default function AccountScreen() {
  const { user, token, loading, login, loginWithProvider, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState<'google' | 'discord' | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<EngagementProgress | null>(null);

  const normalizedEmail = email.trim().toLocaleLowerCase('tr-TR');
  const credentialsValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && password.length >= 6,
    [normalizedEmail, password],
  );

  const submit = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      await login(normalizedEmail, password);
      setPassword('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Giriş yapılamadı.');
    } finally {
      setBusy(false);
    }
  }, [login, normalizedEmail, password]);

  const requestPasswordReset = useCallback(async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Önce geçerli e-posta adresini yazmalısın.');
      return;
    }
    setForgotBusy(true);
    setError('');
    try {
      const response = await api.forgotPassword(normalizedEmail);
      Alert.alert('E-postanı kontrol et', response.message || 'Parola sıfırlama bağlantısı gönderildi.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sıfırlama bağlantısı gönderilemedi.');
    } finally {
      setForgotBusy(false);
    }
  }, [normalizedEmail]);

  const socialLogin = useCallback(async (provider: 'google' | 'discord') => {
    setSocialBusy(provider);
    setError('');
    try {
      await loginWithProvider(provider);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sosyal giriş tamamlanamadı.');
    } finally {
      setSocialBusy(null);
    }
  }, [loginWithProvider]);

  const loadProgress = useCallback(async () => {
    if (!token) return;
    try {
      setProgress(await api.engagement(token));
    } catch {
      setProgress(null);
    }
  }, [token]);

  useEffect(() => {
    // Refresh the account dashboard after a native session becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProgress();
  }, [loadProgress]);

  const completionPercent = useMemo(() => {
    if (!progress?.tasks.length) return 0;
    const completed = progress.tasks.filter((task) => task.completed).length;
    return Math.round((completed / progress.tasks.length) * 100);
  }, [progress]);

  if (loading) return <Screen><ActivityIndicator style={styles.loader} color={theme.green} /></Screen>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandHeader eyebrow="DublajLab hesabı" title={user ? `Merhaba, ${user.display_name}` : 'Giriş yap'} />
        {!user ? (
          <View style={styles.panel}>
            <Text style={styles.copy}>Web hesabınla giriş yap; VIP durumun ve günlük ilerlemen mobilde de görünsün.</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="E-posta"
              placeholderTextColor={theme.muted}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <View style={styles.passwordRow}>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                secureTextEntry={!showPassword}
                placeholder="Parola"
                placeholderTextColor={theme.muted}
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => credentialsValid && void submit()}
                returnKeyType="done"
                style={styles.passwordInput}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Parolayı gizle' : 'Parolayı göster'}
                onPress={() => setShowPassword((current) => !current)}
                style={styles.passwordToggle}>
                <Text style={styles.passwordToggleText}>{showPassword ? 'Gizle' : 'Göster'}</Text>
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ActionButton label={busy ? 'Giriş yapılıyor…' : 'Giriş yap'} onPress={() => void submit()} disabled={busy || !credentialsValid} />
            <Pressable disabled={forgotBusy} onPress={() => void requestPasswordReset()} style={styles.forgotButton}>
              <Text style={styles.forgotText}>{forgotBusy ? 'Gönderiliyor…' : 'Parolamı unuttum'}</Text>
            </Pressable>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>VEYA</Text>
              <View style={styles.divider} />
            </View>
            <View style={styles.socialRow}>
              <Pressable
                disabled={Boolean(socialBusy)}
                onPress={() => void socialLogin('google')}
                style={({ pressed }) => [styles.socialButton, pressed && styles.socialPressed]}>
                <Ionicons name="logo-google" color={theme.text} size={19} />
                <Text style={styles.socialText}>{socialBusy === 'google' ? 'Açılıyor…' : 'Google'}</Text>
              </Pressable>
              <Pressable
                accessibilityHint={!discordAuthEnabled ? 'Discord girişi geçici olarak kapalı' : undefined}
                disabled={Boolean(socialBusy) || !discordAuthEnabled}
                onPress={() => void socialLogin('discord')}
                style={({ pressed }) => [
                  styles.socialButton,
                  styles.discordButton,
                  !discordAuthEnabled && styles.socialDisabled,
                  pressed && discordAuthEnabled && styles.socialPressed,
                ]}>
                <Ionicons name="logo-discord" color={discordAuthEnabled ? '#c7d2fe' : theme.muted} size={20} />
                <Text style={[styles.socialText, styles.discordText, !discordAuthEnabled && styles.socialDisabledText]}>
                  {socialBusy === 'discord' ? 'Açılıyor…' : discordAuthEnabled ? 'Discord' : 'Discord kapalı'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.profile}>
              <View><Text style={styles.label}>ÜYELİK</Text><Text style={styles.value}>{user.has_active_vip ? 'VIP' : 'Ücretsiz'}</Text></View>
              <View><Text style={styles.label}>BUGÜN</Text><Text style={styles.value}>{progress?.today_xp ?? 0} XP</Text></View>
              <View><Text style={styles.label}>SERİ</Text><Text style={styles.value}>{progress?.current_streak ?? 0} gün</Text></View>
            </View>
            <Text style={styles.sectionTitle}>Günlük görevler · %{completionPercent}</Text>
            {progress?.tasks.map((task) => (
              <View key={task.key} style={styles.task}>
                <Text style={styles.taskMark}>{task.completed ? '✓' : '○'}</Text>
                <View style={styles.taskCopy}>
                  <Text style={styles.taskTitle}>{taskLabels[task.key] ?? task.key}</Text>
                  <Text style={styles.taskMeta}>{task.progress}/{task.target} · +{task.xp} XP</Text>
                </View>
              </View>
            ))}
            <View style={styles.logout}><ActionButton label="Çıkış yap" onPress={() => void logout()} /></View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 35 },
  loader: { flex: 1 },
  panel: { margin: 20, marginTop: 8, padding: 18, gap: 13, backgroundColor: theme.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.border },
  copy: { color: theme.muted, lineHeight: 22, marginBottom: 5 },
  input: { minHeight: 52, color: theme.text, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 15, paddingHorizontal: 15 },
  passwordRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 15, overflow: 'hidden' },
  passwordInput: { flex: 1, minHeight: 52, color: theme.text, paddingLeft: 15, paddingRight: 8 },
  passwordToggle: { minHeight: 52, justifyContent: 'center', paddingHorizontal: 14 },
  passwordToggleText: { color: theme.green, fontSize: 12, fontWeight: '900' },
  forgotButton: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 },
  forgotText: { color: theme.purple, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: theme.border },
  dividerText: { color: theme.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  socialRow: { flexDirection: 'row', gap: 10 },
  socialButton: { flex: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, backgroundColor: theme.surfaceRaised, borderWidth: 1, borderColor: theme.border },
  discordButton: { backgroundColor: '#202441', borderColor: '#3f477f' },
  socialPressed: { opacity: 0.72 },
  socialDisabled: { opacity: 0.45 },
  socialDisabledText: { color: theme.muted },
  socialText: { color: theme.text, fontWeight: '900' },
  discordText: { color: '#c7d2fe' },
  error: { color: theme.danger, lineHeight: 20 },
  profile: { flexDirection: 'row', justifyContent: 'space-between', margin: 20, marginTop: 8, padding: 18, backgroundColor: theme.greenDark, borderRadius: 20, borderWidth: 1, borderColor: '#426715' },
  label: { color: '#bef264', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  value: { color: theme.text, fontSize: 18, fontWeight: '900', marginTop: 5 },
  sectionTitle: { color: theme.text, fontSize: 18, fontWeight: '900', marginHorizontal: 20, marginBottom: 12 },
  task: { flexDirection: 'row', alignItems: 'center', gap: 13, marginHorizontal: 20, marginBottom: 10, padding: 15, backgroundColor: theme.surface, borderRadius: 17, borderWidth: 1, borderColor: theme.border },
  taskMark: { color: theme.green, fontSize: 24, fontWeight: '900' },
  taskCopy: { flex: 1 },
  taskTitle: { color: theme.text, fontWeight: '800' },
  taskMeta: { color: theme.muted, fontSize: 12, marginTop: 4 },
  logout: { marginHorizontal: 20, marginTop: 10 },
});
