# Sprint 56 — Güvenli Oturum Çerezi Geçiş Katmanı

## Sonuç

HttpOnly oturum çerezi, Origin tabanlı CSRF koruması ve sunucu taraflı logout
uygulandı. Canlı Railway API hâlâ `railway.app` alan adında olduğu için özellik iki
ayrı production bayrağıyla kapalı gelir; mevcut Bearer akışı bu nedenle kesilmez.

## Uygulananlar

- Başarılı parola ve OAuth girişlerinde isteğe bağlı `dublajlab_session` çerezi.
- Production'da `Secure`, her ortamda `HttpOnly`, `SameSite=Lax` ve kök path.
- Korumalı endpoint'lerde Bearer önceliği, ardından çerez doğrulaması.
- Çerezle yapılan `POST`, `PUT`, `PATCH` ve `DELETE` isteklerinde allowlist
  tabanlı `Origin`/`Sec-Fetch-Site` kontrolü.
- `POST /api/auth/logout` ile çerezin kontrollü silinmesi.
- Frontend isteklerinde `credentials: include`; çerez denemesi başarılıysa eski
  `localStorage` token'ının otomatik temizlenmesi.
- Geçiş sırasında ödeme, yorum, beğeni ve oturum algısının kullanıcı state'iyle
  çalışması; Bearer uyumluluğunun korunması.
- `AUTH_COOKIE_ONLY=true` olduğunda API yanıtı ve OAuth dönüş URL'sinde JWT'nin
  bulunmaması.

## Bayraklar

```env
AUTH_SESSION_COOKIE_ENABLED=false
AUTH_COOKIE_ONLY=false
```

İkinci bayrak birincisini örtük olarak etkinleştirir. İkisi de ancak
`api.dublajlab.com.tr`, Google/Discord callback adresleri ve Vercel API adresi
birlikte hazırlandıktan sonra açılmalıdır.

## Doğrulama

- Oturum hedef testleri: 33 test geçti.
- Tam backend paketi: geçti (yalnız opt-in R2 staging smoke atlandı).
- Frontend: 21/21 Vitest, ESLint ve production build geçti.
- Testler çerezin HttpOnly/Secure niteliklerini, cookie-only token gizlemeyi,
  çerezle `/me` erişimini, kötü Origin reddini, logout'u ve OAuth URL'sinde token
  bulunmamasını kapsıyor.

## Merge ve canlı doğrulama

- PR #18 tüm backend, frontend ve Vercel kontrolleri geçtikten sonra main'e
  birleştirildi (`566fe01`).
- Main CI `39023638768` geçti: frontend 18 saniye, backend 1 dakika 25 saniye.
- Railway production `POST /api/auth/logout` endpoint'i HTTP 200 döndürdü ve
  temizleme çerezi `HttpOnly; Secure; SameSite=lax` niteliklerini taşıdı.
- Production CORS preflight, canonical frontend için
  `access-control-allow-credentials: true` ve doğru allow-origin döndürdü.
- Vercel production bundle'ında `credentials: include` ve `/api/auth/logout`
  kodu doğrulandı.
- Bilinmeyen hesapla yapılan login smoke isteği HTTP 400 ile güvenli biçimde
  reddedildi.

## Canlı aktivasyon — tamamlandı (18 Ekim 2026)

- Railway servisine `api.dublajlab.com.tr` özel alan adı eklendi; CNAME/TXT
  doğrulaması ve TLS başarıyla tamamlandı.
- Vercel `VITE_API_BASE_URL=https://api.dublajlab.com.tr` production ve preview
  ortamlarına uygulandı; CSP `connect-src` özel API alanını kapsayacak şekilde
  düzeltildi.
- Google OAuth yetkili callback listesine
  `https://api.dublajlab.com.tr/api/auth/google/callback` eklendi.
- Railway'de `AUTH_SESSION_COOKIE_ENABLED=true` ve `AUTH_COOKIE_ONLY=true`
  etkinleştirildi.
- Parola girişi, Google OAuth, `/me`, yenileme ve logout canlıda HTTP 200 ile
  doğrulandı. OAuth dönüş URL'sinde ve login yanıtında JWT taşınmadığı görüldü.
- Discord hesabındaki harici erişim kısıtı nedeniyle Discord OAuth production'da
  ayrı özellik bayrağıyla kapalıdır; bu durum cookie-only aktivasyonunu engellemez.
