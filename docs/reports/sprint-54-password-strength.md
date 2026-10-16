# Sprint 54 — Password Strength and Registration Safety

## Amaç

Yeni parola hesaplarında güvenli fakat erişilebilir bir parola politikası uygulamak
ve kullanıcıya kayıt sırasında anlaşılır, iki dilli geri bildirim vermek.

## Yapılanlar

- Yeni parolalar için minimum 10, maksimum 128 karakter politikası backend'de
  zorunlu tutuldu.
- Yaygın/tahmin edilebilir parolalar ile e-posta veya kullanıcı adı içeren parolalar
  Türkçe ve anlamlı `400` yanıtıyla reddediliyor.
- Büyük/küçük harf, sayı veya sembol zorunluluğu getirilmedi; uzun parola
  cümleleri ve Unicode karakterler destekleniyor.
- Kayıt ekranına canlı üç seviyeli güç göstergesi, uygunluk listesi, parola tekrar
  alanı ve göster/gizle düğmesi eklendi.
- Tüm yeni metinler TR/EN sözlüğüne eklendi.
- Yeni hash'ler `bcrypt_sha256` kullanıyor; mevcut `bcrypt` hash'leri doğrulanmaya
  devam ediyor. Böylece bcrypt'in 72-byte girdi sınırı uzun Unicode parolaları
  sessizce zayıflatmıyor.
- Politika yalnızca yeni parola belirleme akışına uygulanıyor; mevcut kullanıcıların
  girişleri geriye dönük uyumlu kaldı.

## Doğrulama

- Backend parola/auth hedefli testler: 18/18 geçti.
- Tam backend paketi: geçti; credential gerektiren R2 staging testi atlandı.
- Frontend Vitest: 19/19 geçti.
- ESLint: geçti.
- TypeScript/Vite production build: geçti.
- `npm audit`: Tailwind 3 araç zincirindeki bilinen 7 transitive bulguyu raporladı;
  otomatik düzeltme Tailwind 4'e kırıcı yükseltme gerektiriyor.

## Not

Ortak parola listesi küçük ve yerel tutuluyor. Daha kapsamlı sızmış parola kontrolü,
parola değerini üçüncü tarafa göndermeyen k-anonimlik veya yerel hash listesiyle ayrı
bir güvenlik çalışması olarak değerlendirilebilir.
