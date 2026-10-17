# Sprint 55 — Güvenli Parola Sıfırlama

## Amaç

Parolasını unutan kullanıcıların destek müdahalesi olmadan, e-posta sahipliğini
kanıtlayarak yeni parola belirleyebilmesini sağlamak.

## Yapılanlar

- Giriş ekranına `Şifremi unuttum / Forgot password?` bağlantısı eklendi.
- Sıfırlama isteği hesap varlığını açıklamayan aynı yanıtı döndürüyor.
- IP ve e-posta başına 15 dakikada beş istek sınırı eklendi.
- Token'ın yalnız SHA-256 özeti veritabanında saklanıyor; ham token URL fragment
  bölümünde taşındığı için sunucu/CDN loglarına ve Referer başlığına gitmiyor.
- Bağlantı 30 dakika geçerli, tek kullanımlı ve yeni istek eskisini geçersiz kılıyor.
- Yeni parola mevcut 10–128 karakter politikasından geçiyor.
- Parola değişince daha önce üretilmiş JWT oturumları reddediliyor.
- Sıfırlama bağlantısını açmak e-posta sahipliğini kanıtladığı için hesabın e-posta
  doğrulaması da tamamlanıyor.
- Arayüz, API yanıtları ve Resend sıfırlama e-postası TR/EN destekli.
- Yeni kolonlar Alembic migration ile ekleniyor.

## Güvenlik notu

JWT halen tarayıcı `localStorage` alanında tutuluyor. HttpOnly çerez geçişi ayrı
bir sonraki iştir; Railway backend'i ile frontend farklı site altında olduğundan
yarım bir çerez geçişi production'a alınmamıştır. Önce aynı-site API alan adı veya
backend-for-frontend proxy kararı uygulanmalıdır.

## Doğrulama

- Parola sıfırlama/auth/e-posta hedefli backend testleri: 41/41 geçti.
- Tam backend paketi geçti; credential gerektiren R2 staging testi atlandı.
- Fresh SQLite Alembic `upgrade -> downgrade -> upgrade` zinciri geçti.
- Frontend Vitest: 21/21 geçti; ESLint ve TypeScript/Vite production build geçti.
- Docker Compose config doğrulaması geçti.
- Production deploy sonrasında canlı Resend sıfırlama akışı ayrıca doğrulanacaktır.
