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

## İzleme bulgusu ve çözümü

Aynı health kontrolü `redis_configured:false` ve `redis_connected:false` döndürdü.
Railway arayüzünde `REDIS_URL` adı görünse de çalışan konteyner bu değeri almıyor.
Rate limit ve job state bu durumda bellek fallback'i kullanır ve deploy/restart
sırasında kaybolabilir.

Mevcut ve çevrimiçi Railway Redis servisinin `REDIS_URL` değeri backend'e Railway
variable reference olarak yeniden bağlandı. Backend deploy edildikten sonra canlı
health endpoint'i HTTP 200 ile birlikte `redis_configured:true` ve
`redis_connected:true` döndürdü. Böylece rate limit ve job state yeniden kalıcı
Redis katmanını kullanmaya başladı.

## Kalan secret hygiene işi

Sağlayıcı anahtarlarının rotasyonu, yeni anahtarı ekle → deploy/smoke test → eski
anahtarı iptal et sırasıyla kesintisiz yapılmalıdır. Resend anahtarı yalnız gönderim
yetkisiyle; diğer sağlayıcı anahtarları da desteklenen en dar kapsamla tutulmalıdır.
