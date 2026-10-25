# DublajLab Mobile

DublajLab'ın React Native ve Expo ile geliştirilen mobil istemcisidir. Mevcut
FastAPI backend'ine bağlanır; katalog, topluluk dublajları, hesap/VIP bilgisi ve
günlük görevleri gösterir. Katalogdaki bir sahne açılarak video izlenebilir,
replikler tek tek kaydedilebilir, kayıtlar backend'e gönderilebilir ve tamamlanan
dublaj uygulama içinde oynatılabilir.

## Ders gereksinimleri

- `useContext`: `src/context/AuthContext.tsx` içinde oturum bilgisini bütün
  ekranlara taşır.
- `useCallback`: giriş/çıkış, kullanıcı yenileme, API listeleme, ses kaydı ve
  dublaj oluşturma işlemlerinin referanslarını kararlı tutar.
- `useMemo`: context değerini, sahne arama-sıralama sonucunu, toplam beğeniyi ve
  günlük görev tamamlanma yüzdesini yalnızca girdileri değişince hesaplar. Sahne
  ekranında kayıt sayacı ve gönderim uygunluğu da `useMemo` ile hesaplanır.

Bu hook'lar yalnızca şartı karşılamak için değil, gerçek uygulama davranışları
için kullanılmaktadır.

## Çalıştırma

1. [Node.js LTS](https://nodejs.org/) ve telefona Expo Go kurulur.
2. Bu klasörde `npm install` çalıştırılır.
3. Gerekirse `.env.example`, `.env` adıyla kopyalanıp API adresi değiştirilir.
4. `npm start` çalıştırılır ve ekrandaki QR kod Expo Go ile taranır.

İlk ses kaydında Android/iOS mikrofon izni sorar. İzin verilince her repliğin
yanındaki kayıt düğmesiyle kayıt alınır. Tüm replikler kaydedildiğinde “Dublajı
oluştur” düğmesi aktif olur; uygulama işi gönderir, sonucu takip eder ve oluşan
videoyu aynı ekranda gösterir.

Android emülatörü için `npm run android`; web önizlemesi için `npm run web`
kullanılabilir. Native giriş akışı güvenlik nedeniyle tarayıcıda kapalıdır;
giriş testi Expo Go, Android emülatörü veya iOS simülatöründe yapılmalıdır.

## Gerçek Android APK

Expo Go yalnızca hızlı geliştirme önizlemesidir. Hocaya veya başka bir cihaza
gösterilecek bağımsız APK aşağıdaki komutla EAS üzerinde hazırlanır:

```bash
npx eas-cli build --platform android --profile preview
```

`preview` profili `eas.json` içinde `buildType: apk` kullanır. Oluşan dosya
telefona doğrudan kurulabilir; Expo Go veya bilgisayarda çalışan geliştirme
sunucusu gerekmez. Paket kimliği `tr.com.dublajlab.mobile` şeklindedir.

Google ve Discord girişleri cihazın sistem tarayıcısında açılır. Başarılı OAuth
işleminden sonra backend yalnızca tam eşleşen `dublajlab://oauth-callback` deep
link'i üzerinden uygulamaya döner ve mobil oturum SecureStore içinde saklanır.

Android Studio ile yerel native proje görmek gerekirse önce şu komut çalıştırılır:

```bash
npx expo prebuild --platform android
```

Oluşan `android` klasörü Android Studio ile açılabilir. Bu klasör üretilen native
katmandır; asıl uygulama kodları `src/app`, `src/context` ve `src/lib` içindedir.

## Sunumda gösterilecek hook örnekleri

1. `AuthContext.tsx`: `useContext` ile oturumun bütün sekmelerde paylaşılması.
2. `index.tsx`: `useCallback` ile katalog isteği, `useMemo` ile arama ve sıralama.
3. `scene/[id].tsx`: `useCallback` ile kayıt/export işlemleri, `useMemo` ile kayıt sayacı.
4. `account.tsx`: `useMemo` ile form doğrulama ve görev yüzdesi.

## Doğrulama

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform android --output-dir dist-android
```

Mobil girişin çalışması için backend'deki `/api/auth/mobile/login` değişikliğinin
canlıya deploy edilmiş olması gerekir. Oturum anahtarı Android Keystore/iOS
Keychain üzerinde Expo SecureStore ile saklanır.
