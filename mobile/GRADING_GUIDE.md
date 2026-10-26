# DublajLab Mobile — Değerlendirme Rehberi

Bu belge, mobil uygulamadaki teknik kararları ders değerlendirme ölçütleriyle
eşleştirir. Uygulama React Native, Expo ve TypeScript ile geliştirilmiştir.

## 1. Kod kalitesi

- Ekranlar `src/app`, tekrar kullanılabilir arayüzler `src/components`, veri
  erişimi `src/lib`, ortak state ise `src/context` altında ayrılmıştır.
- TypeScript tipleri `src/types.ts` içinde merkezî olarak tanımlanır.
- Yorumlar yalnızca kararın nedenini açıkladığı yerlerde kullanılır.
- `npm run typecheck` ve `npm run lint` kalite kapılarıdır.

## 2. Hata yönetimi

- `AppErrorBoundary`, beklenmeyen render hatalarında boş ekran yerine kurtarma
  ekranı gösterir.
- `api.ts`, ağ kopması, 15 saniyelik zaman aşımı, HTTP hata mesajı ve sunucu
  hatalarını kullanıcı dostu mesajlara çevirir.
- Liste ekranlarında hata, boş durum ve tekrar deneme akışları bulunur.
- Bildirim hatası tamamlanmış bir video export'unu başarısız saymaz.

## 3. Veritabanı kullanımı

- Canlı kullanıcı, üyelik, proje ve etkileşim verileri FastAPI üzerinden
  PostgreSQL veritabanında saklanır.
- Mobilde `expo-sqlite` ile `scene_cache` tablosu bulunur. Son başarılı katalog
  JSON olarak cihazda saklanır ve bağlantı yoksa çevrimdışı gösterilir.
- Oturum token'ı düz metin veritabanına değil, işletim sisteminin güvenli
  `SecureStore` alanına yazılır.

## 4. API entegrasyonu

- Mobil uygulama production FastAPI REST servisleriyle JSON ve multipart veri
  alışverişi yapar.
- Google OAuth sistem tarayıcısı ve güvenli deep link callback'iyle çalışır.
- Video, ses kayıtları ve zaman çizelgesi backend'e gönderilir; asenkron iş
  durumu tamamlanana kadar sorgulanır.

## 5. Estetik ve görsel tasarım

- Renkler ve yüzeyler `app-theme.ts` tasarım token'larından gelir.
- Kart, buton, boş durum ve başlık bileşenleri bütün ekranlarda tutarlıdır.
- Koyu tema, yüksek kontrast, dokunma durumları ve erişilebilir etiketler vardır.

## 6. Navigasyon

- Expo Router ile Sahneler, Dublajlar ve Hesabım sekmeleri kullanılır.
- Dinamik `/scene/[id]` rotası sahne detayını açar; detay ekranında geri dönüş
  bulunur.

## 7. Performans iyileştirme

- Uzun listeler `FlatList` ile sanallaştırılır.
- `useMemo` arama, sıralama ve hesaplanan değerleri; `useCallback` ağ ve kullanıcı
  eylemlerini gereksiz yeniden oluşturmaya karşı korur.
- SQLite önbelleği yeniden açılışta ve zayıf bağlantıda ağ bağımlılığını azaltır.
- Büyük video/ses verileri base64'e çevrilmeden dosya ve multipart olarak taşınır.

## 8. State yönetimi

- `AuthContext`, kullanıcı, token, yüklenme, giriş ve çıkış state'ini bütün
  ekranlarda paylaşır.
- Ekrana özel geçici state ilgili ekran içinde tutulur; global state gereksiz
  büyütülmez.
- Context değeri `useMemo`, eylemler `useCallback` ile kararlı tutulur.

## 9. Yerel platform özellikleri

- Mikrofon izni ve `expo-audio` ile gerçek ses kaydı yapılır.
- Export tamamlandığında `expo-notifications` ile cihaz içi bildirim gösterilir.
- Token Android Keystore/iOS Keychain destekli SecureStore'da tutulur.

## 10. Ekstra özellikler

- Video önizleme, zaman çizelgeli çoklu replik kaydı ve sunucuda dublaj export'u.
- Google OAuth, parola sıfırlama, VIP bilgisi, günlük görev ve seri takibi.
- Topluluk dublajları, oynatma/beğeni istatistikleri ve çevrimdışı katalog.

## Sunumda hızlı doğrulama

```powershell
cd "C:\src\Meme Dublaj Studio MVP\mobile"
npm run typecheck
npm run lint
npx expo start --android
```

Gösterim sırası: sahne listesini yenile → bir sahne aç → mikrofon izni verip
replik kaydet → hesap ekranında Context tabanlı oturumu göster → kodda
`AuthContext.tsx`, `scene-cache.ts`, `api.ts` ve `notifications.ts` dosyalarını aç.
