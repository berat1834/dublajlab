# Sprint 52 — E-posta Sahipliği Doğrulaması

## Sorun

Kayıt formu ve Pydantic `EmailStr` yalnız adres biçimini doğruluyordu. Bu nedenle
`ornek123@gmail.com` gibi biçimsel olarak geçerli fakat kullanıcıya ait olduğu
kanıtlanmamış bir adresle hesap oluşturulabiliyor ve “kayıt başarılı” mesajı
gösteriliyordu. SMTP/MX sorgusu tek başına belirli bir posta kutusunun sahipliğini
güvenilir biçimde kanıtlamaz.

## Uygulanan çözüm

- Yeni parola hesaplarına hash'lenmiş, tek kullanımlık ve süreli doğrulama token'ı eklendi.
- Production'da doğrulama varsayılan olarak zorunlu; doğrulanmamış parola hesabı giriş yapamaz.
- Doğrulama ve güvenli, hesap varlığını ifşa etmeyen yeniden gönderme endpoint'leri eklendi.
- SMTP yapılandırması yoksa kayıt `503` ile fail-closed davranır ve sahte başarı göstermez.
- Google/Discord yalnız sağlayıcının doğruladığı e-posta ile kullanıcıyı doğrulanmış sayar.
- Eski kullanıcılar migration sırasında doğrulanmış kabul edilerek kilitlenmez.
- Arayüzde gönderildi, doğrulandı, geçersiz ve süresi doldu durumları Türkçe/İngilizce gösterilir.

## Ortam değişkenleri

`EMAIL_VERIFICATION_REQUIRED`, `EMAIL_VERIFICATION_TTL_MINUTES`, `SMTP_HOST`,
`SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS`
ve `FRONTEND_URL`. Secret değerler yalnız Railway/provider dashboard'da tutulur.

## Doğrulama

- Backend: 152 passed, 1 skipped.
- Auth/e-posta doğrulama hedefli testler: 15 passed.
- Fresh SQLite Alembic upgrade → downgrade → upgrade: geçti.
- Frontend Vitest: 15/15 geçti.
- Frontend ESLint ve production build: geçti.
- npm audit: 0 vulnerability.

## Canlıya alma notu

Kod ve migration hazırdır; gerçek gönderim smoke testi SMTP sağlayıcı hesabı ve
doğrulanmış gönderici domain gerektirir. Bu secret'lar repoya eklenmeden Railway
dashboard'a girilmeli, ardından gerçek bir posta kutusuyla uçtan uca test edilmelidir.
