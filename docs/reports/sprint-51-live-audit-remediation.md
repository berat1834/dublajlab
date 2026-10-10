# Sprint 51 — Canlı Site Denetimi Düzeltmeleri

Tarih: 10 Ekim 2026

## Sonuç

Canlı site ve yönetim paneli denetiminde bulunan kritik/yüksek öncelikli sorunlar minimal
değişikliklerle kapatıldı. Hazır olmayan ürün ekranları gerçek özellik gibi sunulmuyor;
hesap, OAuth, ödeme, moderasyon ve yönetim işlemleri backend tarafından doğrulanıyor.

## Tamamlanan düzeltmeler

- Hesap silmedeki yanlış parola alanı düzeltildi; parola ve OAuth hesapları ayrı test edildi.
- Profil adı/avatar değişiklikleri gerçek `PATCH /api/me/profile` endpoint'ine bağlandı.
- Demo videosu olmayan template yolları `null` yapıldı; canlıda bilinen 404 medya isteği kesildi.
- OAuth state imzalı nonce ve güvenli cookie ile doğrulanıyor; token URL query yerine fragment ile dönüyor.
- Klasik login ve OAuth için ortak admin rol eşleme servisi kullanılıyor.
- Login için IP + e-posta tabanlı başarısız deneme limiti eklendi.
- Hazır olmayan oda, kredi, genel profil ve sahne yönetimi ekranları açıkça “yakında” durumuna alındı.
- TR/EN kapsamı, template metinleri ve dile bağlı tarih formatları genişletildi.
- İngilizce Play job aşamaları/backend hata özeti çevrildi; Dubs ekranındaki Türkçe sahte
  kartlar kaldırıldı ve kütüphane başlığı `My Library` olarak düzeltildi.
- SPA ekranlarına kararlı URL/path ve geri/ileri tarayıcı desteği eklendi.
- Vercel güvenlik header'ları (CSP, nosniff, frame, referrer ve permissions policy) eklendi.
- Shopier ürün URL'si/secret'ları eksikken pending ödeme kaydı oluşturulması engellendi.
- Topluluk akışındaki uydurma kullanıcı/izlenme kartları kaldırıldı; gerçek boş/hata durumu ve CTA eklendi.
- İletişim adresi kullanıcı arayüzünde `destek@dublajlab.com.tr` olarak birleştirildi.

## Yönetim paneli

- Kullanıcı arama ve 30 günlük VIP açma/kapatma arayüzü eklendi.
- Rapor ve proje durumları izin verilen değerlerle sınırlandırıldı.
- Görünür yorum listesi ve yorum gizleme aksiyonu moderasyon paneline bağlandı.
- Pending raporların önce gösterilmesi düzeltildi.
- Admin üyelik, rapor, proje ve yorum işlemleri için audit log tablosu/API/UI eklendi.
- Ops paneline manuel yenileme, son güncelleme zamanı ve güvenli Redis hata sınıfı eklendi.
- FFprobe durumu artık FFmpeg durumundan bağımsız ve doğru raporlanıyor.

## Veritabanı ve container

- `admin_audit_logs` Alembic migration'ı eklendi.
- Eski OAuth migration'ındaki SQLite uyumsuz `ALTER COLUMN`, batch migration'a çevrildi.
- Sıfır veritabanında `alembic upgrade head` başarıyla çalıştırıldı.
- Backend container açılışında Uvicorn'dan önce `alembic upgrade head` çalışıyor.

## Doğrulama

- Backend: 141 test toplandı; 140 geçti, yalnız credential gerektiren R2 staging testi skip edildi.
- Frontend: Vitest 15/15 geçti (Play/Dubs/My Library İngilizce anahtar regresyonu dahil).
- TypeScript/Vite production build geçti.
- ESLint geçti.
- Fresh SQLite migration zinciri geçti.
- Docker Compose config placeholder secret'larla geçti. Docker Desktop engine kapalı olduğu
  için yerel image build bu oturumda çalıştırılamadı; CI/container build sonucu izlenmelidir.
- `git diff --check` geçti.

## Kalan riskler

- JWT hâlâ `localStorage` kullanıyor. HttpOnly cookie geçişi ayrı auth mimarisi çalışmasıdır.
- Login limiter tek process belleğindedir; çoklu replica için Redis tabanlı olması gerekir.
- `ADMIN_EMAILS` listesinden çıkarılan daha önce atanmış adminin rolü otomatik geri alınmaz;
  rol kaynağı/provenance modeli gerekir.
- Shopier sandbox/callback, gerçek mikrofon/export, 375 px mobil görünüm ve gerçek admin hesabı
  ile moderasyon canlı ortamda manuel doğrulanmalıdır.
- `npm audit`, sadece build-time Tailwind 3 bağımlılık zincirinde upstream düzeltmesi olmayan
  7 transitive bulgu raporluyor. Statik production bundle bu paketleri çalıştırmaz; Tailwind 4
  geçişi görsel regresyon testiyle ayrı, kontrollü bir dependency sprintinde yapılmalıdır.
