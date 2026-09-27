# Sprint 26: Ücretsiz ve VIP Üyelik

## Amaç

Placeholder VIP anlatımını gerçek, backend kontrollü üyelik yetkisine dönüştürmek
ve ücretsiz planı kullanılabilir tutmak.

## Plan ayrımı

| Özellik | Ücretsiz | VIP |
| --- | --- | --- |
| Mikrofonla dublaj | Var | Var |
| MP4 export | En fazla 720p | En fazla 1080p |
| AI ses modu | Kilitli | Var |
| VIP hesap rozeti | Yok | Var |

## Teknik uygulama

- `users` tablosuna `membership_tier` ve `membership_expires_at` eklendi.
- Süresi geçmiş VIP kayıtları otomatik olarak aktif sayılmıyor.
- AI job ve geriye uyumlu AI process endpoint'i aktif VIP gerektiriyor.
- Kayıt exportu plan durumuna göre FFmpeg'i 720p veya 1080p sınırıyla çağırıyor.
- Yönetici, doğrulanmış ödeme sonrası kullanıcıya 1–3650 günlük VIP tanımlayabiliyor
  veya üyeliği ücretsiz plana döndürebiliyor.
- Frontend AI modunu kilitli gösteriyor, aktif VIP rozetini menü ve hesap ekranına
  yansıtıyor ve üyelik durumunu yeniden sorgulayabiliyor.
- Shopier URL'si build-time environment değişkenidir. Eksik olduğunda sahte ödeme
  veya istemci taraflı VIP aktivasyonu yapılmıyor.

## Güvenlik sınırı

Ödeme sağlayıcısı callback/webhook doğrulaması için gerçek mağaza bilgileri henüz
sağlanmadığından ödeme sonrası aktivasyon manuel admin işlemiyle yapılır. Frontend
dönüş parametresi tek başına üyelik açmak için kullanılmaz.

## Kontroller

- Backend pytest: 75/75 geçti (gerçek FFmpeg entegrasyonu dahil).
- Frontend Vitest: 3/3 geçti.
- Frontend ESLint ve Vite production build geçti.
- `npm audit`: 0 açık. Vitest, güvenlik düzeltmeli 4.1.11 sürümüne yükseltildi.
- Üyelik migration'ı `182b4895da88` revision'ından başlayarak izole SQLite
  veritabanında uygulandı ve yeni kolonlar doğrulandı.
- Üyelik planı, yeni ücretsiz hesap, admin VIP aktivasyon/iptal, süresi geçmiş
  VIP, ücretsiz hesabın AI için 403 alması ve VIP hesabın AI job oluşturması test edildi.
- FFmpeg komutlarında ücretsiz 720p ve VIP 1080p sınırları doğrulandı.
