# Sprint 53 — Railway Uyumlu Resend E-posta Teslimatı

## Sorun

Canlı kayıt smoke testinde doğrulama e-postası yaklaşık 15 saniye sonra `503`
döndü. Railway'in resmî dokümantasyonu Trial, Free ve Hobby planlarında outbound
SMTP'nin engellendiğini; SMTP'nin yalnız Pro ve üstü planlarda kullanılabildiğini
belirtiyor. Bu nedenle Hosting.com.tr port 465/SSL ayarları doğru olsa bile uygulama
SMTP sunucusuna ulaşamıyordu.

## Uygulanan Çözüm

- `EMAIL_DELIVERY_PROVIDER` ile `smtp` ve `resend` provider seçimi eklendi.
- Resend gönderimi `https://api.resend.com/emails` REST API'sini HTTPS üzerinden kullanır.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` ve isteğe bağlı `RESEND_REPLY_TO`
  yalnız provider dashboard ortam değişkenlerinden okunur.
- Eksik veya bilinmeyen provider yapılandırması fail-closed davranır; sahte
  kayıt başarısı gösterilmez.
- Mevcut SMTP/STARTTLS/implicit SSL desteği SMTP egress izni olan ortamlar için korundu.
- API anahtarının veya credential değerlerinin health ve hata yanıtlarına
  yazılmaması korundu.

## Production Yapılandırması

Railway için:

```env
EMAIL_DELIVERY_PROVIDER=resend
RESEND_API_KEY=<provider-dashboard-only>
RESEND_FROM_EMAIL=DublajLab <noreply@send.dublajlab.com.tr>
RESEND_REPLY_TO=hesap@dublajlab.com.tr
```

`send.dublajlab.com.tr` Resend dashboard'da doğrulanmalı ve Resend'in ürettiği DNS
kayıtları Hosting.com.tr DNS bölgesine aynen eklenmelidir. Mevcut web, ProMail MX,
SPF ve DKIM kayıtları silinmez veya değiştirilmez.

## Bilinen Riskler

- Gerçek teslimat smoke testi için Resend hesabı, doğrulanmış gönderim domaini
  ve Railway'e girilmiş API anahtarı gerekir.
- Provider kota ve rate limitleri izlenmelidir.
- Resend kesintisinde kayıt fail-closed olarak `503` döner; daha sonra yeniden
  gönderme endpoint'i kullanılabilir.

## Doğrulama

- Backend: 157 passed, 1 credential gerektiren R2 staging testi skipped.
- Auth/e-posta hedefli: 20 passed.
- Frontend: ESLint, 15/15 Vitest ve Vite production build geçti.
- `npm audit --omit=dev`: 0 vulnerability.
- Docker Compose config ve `git diff --check`: geçti.
