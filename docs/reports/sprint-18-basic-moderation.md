# Faz 18: Basic Moderation + Reporting + Admin Review

## Amaç
Herkese açık (public) hale gelen dublaj içerikleri için kullanıcı raporlama sistemini (şüpheli, telifli veya uygunsuz içerikleri bildirme) ve bu raporları yönetip içerikleri gizleyebilecek yetkili (Admin) panelini oluşturmak.

## Gerçekleştirilen Geliştirmeler

### Backend Yapısı
1. **Veritabanı Alanları**: 
   - `DubbingProject` tablosuna `moderation_status` alanı (visible, hidden, under_review) eklendi. Public Feed sadece "visible" durumdakileri getirecek şekilde ayarlandı.
   - Yeni `ContentReport` tablosu oluşturuldu (reason, details, status, reporter_user_id, vb.) ve Alembic üzerinden migration (`alembic upgrade head`) sağlandı.
2. **Yeni Route (`admin_router.py`)**: 
   - `GET /api/admin/reports`: Sadece role=admin olanların erişebildiği tüm raporları listeleme uç noktası.
   - `PATCH /api/admin/reports/{report_id}`: Raporun durumunu günceller (dismissed, action_taken vb.).
   - `PATCH /api/admin/projects/{project_id}/moderation`: Raporlanan veya uygunsuz bulunan bir projenin `moderation_status`'unu `hidden` yapar, public feed'den düşmesini sağlar.
3. **Public API**:
   - `POST /api/public/dubs/{project_id}/report`: Kullanıcıların (giriş yapmış veya yapmamış) bir projeyi raporlamasını sağlayan endpoint eklendi.

### Frontend Yapısı
1. **ShowcaseDubs (Dublajlar) & Raporlama**:
   - Herkese açık dublaj kartlarına Bayrak (Flag) butonu eklendi.
   - Tıklandığında açılan `ReportModal.tsx` ile hazır sebepler (Telif Hakkı İhlali, Sakıncalı İçerik vb.) ve opsiyonel detay metni girilebiliyor.
2. **Admin Moderation Panel (`AdminModerationPanel.tsx`)**:
   - Platforma yeni bir `admin` tabı eklendi. Menüde yalnızca `role=admin` yetkisine sahip hesaplara gösteriliyor.
   - Panelin içinde kullanıcıdan gelen şikayetler kronolojik ve bekleyen (pending) sırasıyla listeleniyor.
   - Admin, tek tıkla şikayeti reddedebilir (Dismiss) veya projeyi public feed'den kalıcı olarak gizleyebilir (Hide).

### Testler ve QA
- `test_moderation.py` dosyası ile backend'in uçtan uca moderasyon yetenekleri (yetkisiz kullanıcı engeli, anonim şikayet, projenin feed'den kaybolması vb.) doğrulanmıştır.

## Riskler / Sınırlar
- **Manual Moderation Only**: Henüz otomatik bir AI content scanning veya telif hakkı taraması yoktur. Platform, içeriğin kaldırılması için kullanıcı şikayetlerine (report) ve admin'in manuel aksiyonlarına (hide) bağımlıdır.
- **Anonim Rapor Spam'i**: Giriş yapmamış kullanıcılar da rapor atabileceği için ileride Cloudflare veya Rate Limit bariyerlerine ihtiyaç duyulabilir (MVP için basitleştirildi).
