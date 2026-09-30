# Sprint 38 — Brand Identity Assets + Favicon + Metadata

## Amaç

DublajLab için mevcut ürün arayüzünü yeniden tasarlamadan tutarlı, özgün ve dark UI
ile uyumlu bir marka varlık seti oluşturmak; tarayıcı, PWA ve sosyal paylaşım
metadata'sını aynı kimlikle tamamlamak.

## Marka kararı

- Ürün adı: **DublajLab**
- Slogan: **Kendi sesinle yeniden dublajla.**
- Ana renk: `#B8FF4D`
- İkincil renk: `#22E6C3`
- Arka plan: `#08090D`
- Konsept: laboratuvar şişesi + ses dalgası/oynatma hissi

Logo ve işaret sıfırdan, başka bir ürünün kırmızı/beyaz görsel dilini taklit etmeden
hazırlandı. SVG kaynakları küçük boyutta, okunabilir ve yeniden ölçeklenebilir tutuldu.

## Uygulanan değişiklikler

### Marka varlıkları

- `frontend/public/assets/dublajlab-logo.svg`: yatay logo
- `frontend/public/assets/dublajlab-mark.svg`: bağımsız marka işareti
- `frontend/public/assets/favicon.svg`: küçük ölçekte sadeleştirilmiş favicon
- `frontend/public/assets/apple-touch-icon.png`: 180×180 Apple touch icon
- `frontend/public/assets/pwa-192.png`: 192×192 PWA ikonu
- `frontend/public/assets/pwa-512.png`: 512×512 PWA ikonu
- `frontend/public/assets/dublajlab-social-card.svg`: sosyal kart kaynak tasarımı
- `frontend/public/assets/dublajlab-social-card.png`: 1200×630 paylaşım görseli

### Arayüz

- Navbar, footer ve auth ekranındaki farklı metin/ikon wordmark'ları tek yatay logo
  asset'ine bağlandı.
- Mevcut Tailwind `lime` ve `ink` tokenları marka kararındaki `#B8FF4D` ve
  `#08090D` değerlerine eşlendi; ikincil `mint` tokenı `#22E6C3` olarak tanımlandı.
- Desktop ve mobil navbar ölçülerinde taşmayı önlemek için yükseklik ve maksimum
  genişlik sınırları korundu.
- Sayfa yerleşimi, navigasyon davranışı ve ürün akışı değiştirilmedi.

### Tarayıcı ve paylaşım metadata'sı

- Sekme başlığı `DublajLab — Kendi Sesinle Dublaj Yap` olarak güncellendi.
- Description, theme color, canonical URL, Apple web-app alanları eklendi.
- Open Graph ve Twitter Card başlık, açıklama, görsel ve alt metinleri eklendi.
- `site.webmanifest`; ad, kısa ad, tema/arka plan rengi ve PWA ikonlarıyla oluşturuldu.
- Metadata içindeki canonical ve sosyal kart URL'leri mevcut canlı adres
  `https://dublajlab-sigma.vercel.app/` ile eşleştirildi.

## Manuel QA

- Favicon kaynağı ve production build çıktısındaki bağlantısı kontrol edildi.
- Yatay logo masaüstü ve mobil navbar ölçülerinde kontrol edildi.
- Auth ve footer logo kullanımı kontrol edildi.
- Open Graph/Twitter alanları build edilen HTML kaynağında doğrulandı.
- PNG boyutları 180×180, 192×192, 512×512 ve 1200×630 olarak doğrulandı.

## Validation

- `npm run lint`: geçti
- `npm run test -- --run`: 4 test dosyası, 7/7 test geçti
- `npm run build`: TypeScript ve Vite production build geçti
- `npm audit --audit-level=high`: 0 güvenlik açığı
- Production build asset/metadata kontrolü: geçti
- Favicon HTTP kontrolü: `200`, `image/svg+xml`
- Manifest HTTP kontrolü: `200`, `application/manifest+json`
- Desktop (1440×1000) ve mobil (390×844) headless Chrome render QA: geçti
- `git diff --check`: geçti

İlk test/build çağrısı çalışma ortamının `esbuild` alt sürecini engellemesi nedeniyle
`spawn EPERM` verdi. Kod değiştirilmeden izinli süreç ortamında aynı komutlar tekrar
çalıştırıldı ve başarıyla tamamlandı.

## Bilinen sınırlar

- Sosyal ağların önbelleğe aldığı eski Open Graph görseli, deploy sonrasında ilgili
  platformun cache yenileme aracına ihtiyaç duyabilir.
- SVG favicon modern tarayıcıları hedefler; Apple cihazları için ayrıca PNG ikon
  sağlanmıştır.
