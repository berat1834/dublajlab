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

## Doğrulama

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform android --output-dir dist-android
```

Mobil girişin çalışması için backend'deki `/api/auth/mobile/login` değişikliğinin
canlıya deploy edilmiş olması gerekir. Oturum anahtarı Android Keystore/iOS
Keychain üzerinde Expo SecureStore ile saklanır.
