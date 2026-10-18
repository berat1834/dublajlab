# Sprint 57 — Production Secret Temizliği

## Sonuç

Resend'in canlı gönderim sağlayıcısı olduğu doğrulandıktan sonra artık kullanılmayan
SMTP değişkenleri Railway production ortamından kaldırıldı. Deploy sonrası backend
çalışmaya devam etti ve özel API alanındaki health endpoint'i HTTP 200 döndürdü.

## Kaldırılan değişkenler

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_USE_TLS`
- `SMTP_USE_SSL`

## Korunan e-posta yapılandırması

- `EMAIL_DELIVERY_PROVIDER=resend`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO`

Değerler rapora veya repository'ye yazılmadı.

## Doğrulama

- Railway Variables ekranında `SMTP_*` değişkenlerinin bulunmadığı görüldü.
- Gerekli Resend değişkenlerinin mevcut olduğu görüldü.
- `https://api.dublajlab.com.tr/api/health` deploy sonrasında HTTP 200 ve
  `status: ok` döndürdü.
- Git tarafından izlenen yalnızca örnek `.env` dosyaları bulundu; gerçek `.env`,
  PEM/private key veya bilinen gerçek secret biçimi saptanmadı.

## İzleme bulgusu

Aynı health kontrolü `redis_configured:false` ve `redis_connected:false` döndürdü.
Railway arayüzünde `REDIS_URL` adı görünse de çalışan konteyner bu değeri almıyor.
Rate limit ve job state bu durumda bellek fallback'i kullanır ve deploy/restart
sırasında kaybolabilir. Redis servis bağlantısı ayrı, öncelikli operasyon işi olarak
açık tutulmalıdır.

## Kalan secret hygiene işi

Sağlayıcı anahtarlarının rotasyonu, yeni anahtarı ekle → deploy/smoke test → eski
anahtarı iptal et sırasıyla kesintisiz yapılmalıdır. Resend anahtarı yalnız gönderim
yetkisiyle; diğer sağlayıcı anahtarları da desteklenen en dar kapsamla tutulmalıdır.
