import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href } from 'expo-router';

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
  const { user, token, loading, login, loginWithProvider, logout, refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState<'google' | 'discord' | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<EngagementProgress | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [profileName, setProfileName] = useState(user?.display_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [previousUser, setPreviousUser] = useState(user);
  const [profileBusy, setProfileBusy] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteName, setDeleteName] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [mfaPassword, setMfaPassword] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[]>([]);
  const [mfaBusy, setMfaBusy] = useState(false);

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

  const submitRegister = useCallback(async () => {
    setBusy(true); setError('');
    try {
      await api.register(normalizedEmail, password, displayName.trim());
      Alert.alert('Hesap oluşturuldu', 'E-posta doğrulama bağlantısını kontrol et. Ardından giriş yapabilirsin.');
      setAuthMode('login');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Kayıt tamamlanamadı.'); }
    finally { setBusy(false); }
  }, [displayName, normalizedEmail, password]);

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

  if (user && user !== previousUser) {
    setPreviousUser(user);
    setProfileName(user.display_name);
    setAvatarUrl(user.avatar_url || '');
  }

  const saveProfile = useCallback(async () => {
    if (!token || !user) return;
    const trimmedAvatar = avatarUrl.trim();
    if (trimmedAvatar) {
      try {
        const parsed = new URL(trimmedAvatar);
        if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('URL scheme');
      } catch {
        Alert.alert('Profil kaydedilemedi', 'Avatar için http:// veya https:// ile başlayan geçerli bir görsel bağlantısı gir.');
        return;
      }
    }
    setProfileBusy(true);
    try {
      await api.updateProfile(profileName.trim(), trimmedAvatar || null, token);
      await refreshUser();
      Alert.alert('Kaydedildi', 'Profilin güncellendi.');
    } catch (reason) {
      Alert.alert('Kaydedilemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setProfileBusy(false);
    }
  }, [avatarUrl, profileName, refreshUser, token, user]);

  const deleteAccount = useCallback(async () => {
    if (!token || !user) return;
    setDeleting(true);
    try {
      await api.deleteAccount(deleteName, deletePassword || null, token);
      await logout();
      setShowDeleteConfirm(false);
      Alert.alert('Hesap silindi', 'Hesap erişimin kapatıldı. Topluluk paylaşımları ile yasal olarak saklanması gereken işlem kayıtları korunabilir.');
    } catch (reason) {
      Alert.alert('Hesap silinemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setDeleting(false);
    }
  }, [deleteName, deletePassword, logout, token, user]);

  const startMfaSetup = useCallback(async () => {
    if (!token) return;
    setMfaBusy(true);
    try {
      const result = await api.startAdminMfaSetup(mfaPassword, token);
      setMfaSecret(result.secret);
      setMfaPassword('');
    } catch (reason) {
      Alert.alert('MFA kurulumu başlatılamadı', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setMfaBusy(false);
    }
  }, [mfaPassword, token]);

  const confirmMfaSetup = useCallback(async () => {
    if (!token) return;
    setMfaBusy(true);
    try {
      const result = await api.confirmAdminMfaSetup(mfaCode.trim(), token);
      setMfaRecoveryCodes(result.recovery_codes);
      setMfaSecret('');
      setMfaCode('');
      await refreshUser();
      Alert.alert('Yönetici MFA etkin', 'Kurtarma kodlarını güvenli bir yere kaydet. Bu kodlar tekrar gösterilmez.');
    } catch (reason) {
      Alert.alert('MFA doğrulanamadı', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
    } finally {
      setMfaBusy(false);
    }
  }, [mfaCode, refreshUser, token]);

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
            <View style={styles.authTabs}><Pressable style={[styles.authTab, authMode === 'login' && styles.authTabActive]} onPress={() => setAuthMode('login')}><Text style={styles.authTabText}>Giriş</Text></Pressable><Pressable style={[styles.authTab, authMode === 'register' && styles.authTabActive]} onPress={() => setAuthMode('register')}><Text style={styles.authTabText}>Kayıt ol</Text></Pressable></View>
            <Text style={styles.copy}>{authMode === 'login' ? 'Web hesabınla giriş yap; VIP durumun ve günlük ilerlemen mobilde de görünsün.' : 'Web ve mobilde kullanacağın tek hesabı oluştur.'}</Text>
            {authMode === 'register' ? <TextInput placeholder="Görünen ad" placeholderTextColor={theme.muted} value={displayName} onChangeText={setDisplayName} style={styles.input} /> : null}
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
            <ActionButton label={busy ? 'İşleniyor…' : authMode === 'login' ? 'Giriş yap' : 'Hesap oluştur'} onPress={() => void (authMode === 'login' ? submit() : submitRegister())} disabled={busy || !credentialsValid || (authMode === 'register' && displayName.trim().length < 2)} />
            {authMode === 'login' ? <Pressable disabled={forgotBusy} onPress={() => void requestPasswordReset()} style={styles.forgotButton}>
              <Text style={styles.forgotText}>{forgotBusy ? 'Gönderiliyor…' : 'Parolamı unuttum'}</Text>
            </Pressable> : null}
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
            <View style={styles.accountIdentity}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.accountAvatar} />
              ) : (
                <View style={styles.accountAvatarFallback}>
                  <Text style={styles.accountInitial}>{user.display_name.charAt(0).toLocaleUpperCase('tr-TR')}</Text>
                </View>
              )}
              <View style={styles.identityCopy}>
                <Text style={styles.identityName}>{user.display_name}</Text>
                <Text style={styles.identityEmail}>{user.email}</Text>
                <Text style={styles.identityTier}>{user.has_active_vip ? 'VIP üye' : 'Acemi Denek · Ücretsiz'}</Text>
              </View>
              <Pressable onPress={() => router.navigate('/profile' as Href)} style={styles.profileLink}>
                <Text style={styles.profileLinkText}>Profilim</Text>
              </Pressable>
            </View>
            <View style={styles.profile}>
              <View><Text style={styles.label}>ÜYELİK</Text><Text style={styles.value}>{user.has_active_vip ? 'VIP' : 'Ücretsiz'}</Text></View>
              <View><Text style={styles.label}>BUGÜN</Text><Text style={styles.value}>{progress?.today_xp ?? 0} XP</Text></View>
              <View><Text style={styles.label}>SERİ</Text><Text style={styles.value}>{progress?.current_streak ?? 0} gün</Text></View>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Profil ayarları</Text>
              <TextInput value={profileName} onChangeText={setProfileName} maxLength={50} placeholder="Görünen ad" placeholderTextColor={theme.muted} style={styles.input} />
              <Text style={styles.fieldLabel}>Avatar görsel bağlantısı</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="url"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                maxLength={255}
                placeholder="https://..."
                placeholderTextColor={theme.muted}
                style={styles.input}
              />
              <Text style={styles.hint}>Bio ve hesabı gizleme ayarları web’de de henüz kullanıma açık değil.</Text>
              <ActionButton
                label={profileBusy ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
                disabled={profileBusy || profileName.trim().length < 2 || (profileName.trim() === user.display_name && avatarUrl.trim() === (user.avatar_url || ''))}
                onPress={() => void saveProfile()}
              />
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Üyelik ve güvenlik</Text>
              <Text style={styles.copy}>{user.has_active_vip ? 'VIP özelliklerin aktif.' : 'Ücretsiz üyelik kullanıyorsun. VIP ile 1080p dışa aktarma ve AI ses özelliklerine erişebilirsin.'}</Text>
              <ActionButton label="Üyelik ayrıntıları" onPress={() => router.navigate('/membership' as Href)} />
              <Text style={user.email_verified ? styles.verified : styles.unverified}>
                {user.email_verified ? '✓ E-posta adresin doğrulandı' : 'E-posta adresin henüz doğrulanmadı'}
              </Text>
              {!user.email_verified ? <ActionButton
                label={verificationBusy ? 'Gönderiliyor…' : 'Doğrulama e-postasını tekrar gönder'}
                disabled={verificationBusy}
                onPress={async () => {
                  setVerificationBusy(true);
                  try {
                    const result = await api.resendVerification(user.email);
                    Alert.alert('Doğrulama e-postası', result.message);
                  } catch (reason) {
                    Alert.alert('Gönderilemedi', reason instanceof Error ? reason.message : 'Tekrar deneyin.');
                  } finally {
                    setVerificationBusy(false);
                  }
                }}
              /> : null}
              <Pressable onPress={() => void Linking.openURL('mailto:destek@dublajlab.com.tr?subject=%C5%9Eifre%20S%C4%B1f%C4%B1rlama')}>
                <Text style={styles.supportLink}>Parola ve güvenlik yardımı için destekle iletişime geç</Text>
              </Pressable>
            </View>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Discord bağlantısı</Text>
              <Text style={styles.copy}>Discord hesabını bağlayarak sosyal giriş seçeneklerini kullanabilirsin.</Text>
              {user.discord_linked ? (
                <Text style={styles.discordConnected}>✓ Discord hesabı bağlı</Text>
              ) : (
                <Text style={styles.hint}>Güvenli hesap bağlama akışı tamamlanana kadar mevcut hesaba Discord ekleme mobilde kapalıdır. Discord ile giriş, giriş ekranından ayrı bir oturum olarak kullanılabilir.</Text>
              )}
            </View>
            {user.role === 'admin' ? (
              <View style={styles.panel}>
                <Text style={styles.sectionTitle}>Yönetici MFA</Text>
                <Text style={user.mfa_enabled ? styles.verified : styles.copy}>
                  {user.mfa_enabled ? '✓ Çok faktörlü kimlik doğrulama etkin' : 'Yönetici hesabını authenticator uygulamasıyla koru.'}
                </Text>
                {!user.mfa_enabled && !mfaSecret ? (
                  user.has_password ? (
                    <>
                      <TextInput
                        autoComplete="current-password"
                        secureTextEntry
                        value={mfaPassword}
                        onChangeText={setMfaPassword}
                        placeholder="Mevcut parolan"
                        placeholderTextColor={theme.muted}
                        style={styles.input}
                      />
                      <ActionButton label={mfaBusy ? 'Başlatılıyor…' : 'MFA kurulumunu başlat'} disabled={mfaBusy || !mfaPassword} onPress={() => void startMfaSetup()} />
                    </>
                  ) : <Text style={styles.unverified}>MFA kurmak için hesabında parola bulunmalı.</Text>
                ) : null}
                {!user.mfa_enabled && mfaSecret ? (
                  <>
                    <Text style={styles.copy}>Authenticator uygulamasına bu gizli anahtarı ekle:</Text>
                    <Text selectable style={styles.mfaSecret}>{mfaSecret}</Text>
                    <TextInput
                      keyboardType="number-pad"
                      autoComplete="one-time-code"
                      value={mfaCode}
                      onChangeText={setMfaCode}
                      placeholder="6 haneli doğrulama kodu"
                      placeholderTextColor={theme.muted}
                      style={styles.input}
                    />
                    <ActionButton label={mfaBusy ? 'Doğrulanıyor…' : 'MFA’yı etkinleştir'} disabled={mfaBusy || mfaCode.trim().length < 6} onPress={() => void confirmMfaSetup()} />
                  </>
                ) : null}
                {mfaRecoveryCodes.length ? (
                  <View style={styles.recoveryPanel}>
                    <Text style={styles.recoveryTitle}>Kurtarma kodları — şimdi güvenli yere kaydet</Text>
                    <Text selectable style={styles.recoveryCodes}>{mfaRecoveryCodes.join('\n')}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>Gizlilik</Text>
              <Text style={styles.copy}>Hesap gizleme seçeneği web’de henüz kullanıma açık değil. Paylaştığın dublajların görünürlüğünü Kütüphanem’den yönetebilirsin.</Text>
              <Pressable onPress={() => router.navigate('/library')}><Text style={styles.supportLink}>Kütüphanemi aç</Text></Pressable>
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
            <View style={styles.dangerPanel}>
              <Text style={styles.dangerTitle}>Hesabı sil</Text>
              <Text style={styles.dangerCopy}>Hesap erişimini ve profilini kalıcı olarak kapatır. Projelerin, çıktı videoların ve ilişkili topluluk verilerin silinir. Ödeme ve işlem kayıtları muhasebe yükümlülükleri nedeniyle saklanabilir. Bu işlem geri alınamaz.</Text>
              {!showDeleteConfirm ? (
                <Pressable onPress={() => setShowDeleteConfirm(true)} style={styles.dangerButton}>
                  <Text style={styles.dangerButtonText}>Hesabımı kalıcı olarak sil</Text>
                </Pressable>
              ) : (
                <View style={styles.deleteForm}>
                  <Text style={styles.dangerCopy}>Devam etmek için görünen adını aynen yaz: {user.display_name}</Text>
                  <TextInput value={deleteName} onChangeText={setDeleteName} placeholder="Görünen ad" placeholderTextColor={theme.muted} style={styles.input} />
                  {user.has_password ? <TextInput
                    autoComplete="current-password"
                    secureTextEntry
                    value={deletePassword}
                    onChangeText={setDeletePassword}
                    placeholder="Mevcut parolan"
                    placeholderTextColor={theme.muted}
                    style={styles.input}
                  /> : null}
                  <Text style={styles.dangerCopy}>OAuth hesabıysa parola istenmez. Hesap silindiğinde açık oturum da kapatılır.</Text>
                  <ActionButton
                    label={deleting ? 'Hesap siliniyor…' : 'Silme işlemini onayla'}
                    disabled={deleting || deleteName !== user.display_name || (Boolean(user.has_password) && !deletePassword)}
                    onPress={() => void deleteAccount()}
                  />
                  <Pressable disabled={deleting} onPress={() => { setShowDeleteConfirm(false); setDeleteName(''); setDeletePassword(''); }} style={styles.cancelDelete}>
                    <Text style={styles.cancelDeleteText}>Vazgeç</Text>
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.logout}><ActionButton label="Çıkış yap" onPress={() => void logout()} /></View>
          </>
        )}
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Diğer bölümler</Text>
          <Pressable onPress={() => router.navigate('/daily')} style={styles.navRow}><Text style={styles.navText}>Günün Dublajı, görevler ve başarımlar</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push('/help')} style={styles.navRow}><Text style={styles.navText}>Nasıl kullanılır? · Yardım</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/preview/[feature]', params: { feature: 'favorites' } })} style={styles.navRow}><Text style={styles.navText}>Favoriler · yakında</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/preview/[feature]', params: { feature: 'scenes' } })} style={styles.navRow}><Text style={styles.navText}>Kullanıcı sahneleri · yakında</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/preview/[feature]', params: { feature: 'credits' } })} style={styles.navRow}><Text style={styles.navText}>Krediler · yakında</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/preview/[feature]', params: { feature: 'room' } })} style={styles.navRow}><Text style={styles.navText}>Çok oyunculu oda · yakında</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Text style={styles.legalLabel}>Bilgi ve yasal metinler · taslak</Text>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'about' } })} style={styles.navRow}><Text style={styles.navText}>Hakkımızda</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'contact' } })} style={styles.navRow}><Text style={styles.navText}>İletişim ve destek</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'privacy' } })} style={styles.navRow}><Text style={styles.navText}>Gizlilik politikası</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'terms' } })} style={styles.navRow}><Text style={styles.navText}>Kullanım koşulları</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'copyright' } })} style={styles.navRow}><Text style={styles.navText}>Telif bildirimi</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'refund' } })} style={styles.navRow}><Text style={styles.navText}>İade ve iptal koşulları</Text><Text style={styles.chevron}>›</Text></Pressable>
          <Pressable onPress={() => router.push({ pathname: '/legal/[page]', params: { page: 'distance_selling' } })} style={styles.navRow}><Text style={styles.navText}>Mesafeli satış sözleşmesi</Text><Text style={styles.chevron}>›</Text></Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="DublajLab stüdyo konumunu haritada göster"
          onPress={() => router.push('/studio-location' as Href)}
          style={({ pressed }) => [styles.locationCard, pressed && styles.locationCardPressed]}>
          <View style={styles.locationIcon}>
            <Ionicons name="location" color={theme.green} size={25} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationEyebrow}>İLETİŞİM VE KONUM</Text>
            <Text style={styles.locationTitle}>DublajLab Stüdyo</Text>
            <Text style={styles.locationText}>Temsili konumu haritada gör ve yol tarifi al.</Text>
          </View>
          <Ionicons name="chevron-forward" color={theme.muted} size={22} />
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 35 },
  loader: { flex: 1 },
  accountIdentity: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 20, marginTop: 8, marginBottom: 6 },
  accountAvatar: { width: 58, height: 58, borderRadius: 16 },
  accountAvatarFallback: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: theme.greenDark, borderWidth: 1, borderColor: '#426715' },
  accountInitial: { color: theme.green, fontSize: 23, fontWeight: '900' },
  identityCopy: { flex: 1 },
  identityName: { color: theme.text, fontSize: 17, fontWeight: '900' },
  identityEmail: { color: theme.muted, fontSize: 12, marginTop: 2 },
  identityTier: { color: theme.green, fontSize: 11, fontWeight: '800', marginTop: 4 },
  profileLink: { padding: 10, borderRadius: 11, backgroundColor: theme.surfaceRaised },
  profileLinkText: { color: theme.text, fontSize: 12, fontWeight: '900' },
  panel: { margin: 20, marginTop: 8, padding: 18, gap: 13, backgroundColor: theme.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.border },
  copy: { color: theme.muted, lineHeight: 22, marginBottom: 5 },
  fieldLabel: { color: theme.text, fontSize: 13, fontWeight: '800', marginBottom: -6 },
  hint: { color: theme.muted, fontSize: 12, lineHeight: 18 },
  verified: { color: theme.green, fontWeight: '800', lineHeight: 20 },
  unverified: { color: '#fbbf24', fontWeight: '800', lineHeight: 20 },
  supportLink: { color: theme.green, fontWeight: '800', lineHeight: 20, textDecorationLine: 'underline' },
  navRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: theme.border },
  navText: { flex: 1, color: theme.text, fontWeight: '700', paddingVertical: 10 },
  chevron: { color: theme.muted, fontSize: 24, paddingLeft: 10 },
  legalLabel: { color: theme.muted, fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', paddingTop: 10 },
  discordConnected: { color: '#c7d2fe', fontWeight: '900', padding: 12, textAlign: 'center', backgroundColor: '#202441', borderRadius: 13 },
  mfaSecret: { color: theme.green, backgroundColor: theme.background, borderRadius: 12, padding: 14, fontFamily: 'monospace', overflow: 'hidden' },
  recoveryPanel: { padding: 14, borderRadius: 14, backgroundColor: '#2a210c', borderWidth: 1, borderColor: '#854d0e' },
  recoveryTitle: { color: '#fde68a', fontWeight: '900', lineHeight: 19, marginBottom: 8 },
  recoveryCodes: { color: theme.text, fontFamily: 'monospace', lineHeight: 23 },
  dangerPanel: { marginHorizontal: 20, marginTop: 20, padding: 18, gap: 12, borderRadius: 20, backgroundColor: '#260f14', borderWidth: 1, borderColor: '#7f1d1d' },
  dangerTitle: { color: '#fb7185', fontSize: 18, fontWeight: '900' },
  dangerCopy: { color: '#fda4af', lineHeight: 20 },
  dangerButton: { alignSelf: 'flex-start', borderRadius: 12, padding: 12, backgroundColor: '#4c101d', borderWidth: 1, borderColor: '#7f1d1d' },
  dangerButtonText: { color: '#fecdd3', fontWeight: '900' },
  deleteForm: { gap: 12 },
  cancelDelete: { alignItems: 'center', padding: 12 },
  cancelDeleteText: { color: theme.muted, fontWeight: '800' },
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
  locationCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginHorizontal: 20, marginTop: 18, marginBottom: 20, padding: 16, backgroundColor: theme.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.border },
  locationCardPressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  locationIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.greenDark, borderWidth: 1, borderColor: '#426715' },
  locationCopy: { flex: 1 },
  locationEyebrow: { color: theme.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  locationTitle: { color: theme.text, fontSize: 17, fontWeight: '900', marginTop: 3 },
  locationText: { color: theme.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  authTabs: { flexDirection: 'row', gap: 8 }, authTab: { flex: 1, alignItems: 'center', padding: 11, borderRadius: 12, backgroundColor: theme.background }, authTabActive: { backgroundColor: theme.greenDark, borderWidth: 1, borderColor: theme.green }, authTabText: { color: theme.text, fontWeight: '900' }, vipActive: { color: theme.green, fontWeight: '900', textAlign: 'center', padding: 10 },
});
