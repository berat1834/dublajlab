# Sprint 34: Production Retention Deploy & Smoke Test

## 1. Deployment Durumu
- **Faz 33 Commiti**: `feat: implement plan-based media retention (Phase 33)` başarıyla pushlandı.
- **GitHub Actions (CI)**: Pipeline üzerinden tüm backend testleri (%100) başarıyla çalıştı ve yeşil (passed) sonuçlandı.
- **Railway Backend Deploy**: `alembic upgrade head` başarıyla uygulandı ve `retention_expires_at` kolonu canlı veritabanına yansıdı. Backend health endpoint erişilebilir durumda (`200 OK`).
- **Production Storage (Railway Volume)**: `MEDIA_ROOT`'un `/app/media` olduğu ve volume mount'un başarılı şekilde gerçekleştiği loglar üzerinden doğrulandı. (Volume mount dizini altındaki uploads, outputs ve recordings klasörleri mevcuttur).

## 2. Canlı Ortam Smoke Test Özeti
Canlı platformda aşağıdaki ana akışlar sırasıyla doğrulanmıştır:
- **Kullanıcı İşlemleri**: Sorunsuz bir şekilde kayıt/giriş yapılabildi.
- **Yükleme ve Kayıt**: Başarılı şekilde video upload edildi, mikrofon erişimi sağlanarak ses dublaj kaydı tamamlandı.
- **Export (Çıktı Alma)**: AI job / Export kuyruğa başarıyla eklendi ve sonuç üretildi.
- **Kütüphane**: Export edilen dosya "Kataloğum" sekmesinde hatasız listeleniyor ve `download_url`'in geçerli olduğu (dolu olduğu) görüldü.
- **Public Feed Özelliği**: Proje "Public" yapıldığında Dublajlar (feed) sekmesinde başarılı şekilde listelendi. (Eğer dosya fiziksel olarak yoksa bu alanda gösterilmeyeceği kuralı testlerle ve kod review'iyle sabitlendi).
- **Retention**: Canlı sistemde agresif dosya silme yapılmadı. Yalnızca backend testleriyle (VIP=30 gün, Free=24 saat) doğrulanan policy'nin deploy edildiği kontrol edildi.

## 3. Kalan Riskler ve Notlar
- Faz 33'te yazılan policy gereği 24 saati (veya 30 günü) geçen dosyalar Maintenance Worker veya harici tetikleyici tarafından temizlenmeye hazırdır. Ancak CleanupWorker cron tetikleyicisi (örneğin UptimeRobot veya harici bir cron trigger ile) production ortamında güvenli sıklıkta tetiklenmelidir.
- Mevcut yapı stabil ve yeni Plan-Based Retention politikası devrededir. Kullanıcı deneyimi kesintiye uğramamıştır.
