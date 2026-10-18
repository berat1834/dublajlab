# Sprint 59 — Resend Webhook ve Teslimat Görünürlüğü

## Sonuç

Resend e-posta olaylarını güvenli biçimde kabul eden
`POST /api/webhooks/resend` endpoint'i eklendi. Endpoint ham istek gövdesini
`svix-id`, `svix-timestamp` ve `svix-signature` başlıklarıyla doğrular. Beş
dakikadan eski veya gelecekteki istekler reddedilir; aynı `svix-id` tekrar
geldiğinde olay ikinci kez yazılmaz.

Takip edilen olaylar:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.bounced`
- `email.complained`
- `email.failed`
- `email.suppressed`

Veri minimizasyonu için tam alıcı adresi, konu ve sağlayıcının serbest metin hata
mesajı saklanmaz. Yalnızca olay kimliği/türü, Resend e-posta kimliği, alıcı alan
adı, güvenli hata sınıflandırması ve zaman damgaları tutulur.

Admin operasyon paneline son 24 saat için toplam olay, teslim, gecikme,
bounce/başarısız ve şikâyet sayaçları ile son olay zamanı eklendi.

## Canlıya alma

1. Resend Webhooks ekranında endpoint olarak
   `https://api.dublajlab.com.tr/api/webhooks/resend` eklenir.
2. En az `email.delivered`, `email.delivery_delayed`, `email.bounced`,
   `email.complained` ve `email.failed` olayları seçilir.
3. Resend'in verdiği `whsec_...` signing secret, Railway backend servisinde
   `RESEND_WEBHOOK_SECRET` adıyla eklenir. Değer repoya yazılmaz.
4. Railway deploy tamamlandıktan sonra Resend test/replay olayı gönderilir.
5. Resend denemesi HTTP 200 göstermeli; admin panelinde Resend Webhook yeşil ve
   24 saatlik sayaçlar görünmelidir.

## Doğrulama

- Hedefli backend testleri: 8/8 geçti.
- Tam backend test paketi: geçti (bir test ortam koşuluyla skip).
- Frontend TypeScript ve ESLint: geçti.
- Alembic migration zincirinin yeni head'i: `a1b2c3d4e5f7`.
- `git diff --check`: geçti.

## Production kabulü

- Resend webhook endpoint'i `Enabled` durumunda.
- Railway `RESEND_WEBHOOK_SECRET` yapılandırması yüklendi; imzasız istek doğru
  biçimde HTTP 400 ile reddedildi.
- Gerçek parola sıfırlama e-postası HTTP 200 ile oluşturuldu.
- Resend'den gelen `email.delivered` olayları tek denemede HTTP 200 aldı.
- Endpoint yanıtı `{"status":"accepted"}` olarak Resend panelinde görüldü.
- Canlı API health ve Redis bağlantısı sağlıklı kaldı.

Bu kanıtlarla production webhook smoke testi ve Sprint 59 kabulü tamamlandı.
