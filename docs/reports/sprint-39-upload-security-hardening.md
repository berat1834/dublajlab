# Sprint 39 Raporu: Upload Security Hardening

**Tarih:** 26 Eylül 2026 (Tahmini)
**Durum:** Tamamlandı

## 1. Hedefler

Platforma video yükleme (`POST /api/video/upload`) işleminin güvenliğini artırmak:
- **Diski ve CPU'yu Koruma:** Kullanıcıların yanlışlıkla (veya kasten) sahte uzantılı, zararlı, geçersiz boyutlarda veya bozuk videolar yükleyerek sistemi tıkamasını önlemek.
- **Fail-Fast Yaklaşımı:** Geçersiz dosyaları diske tamamen kaydetmeden önce (veya kaydettikten hemen sonra en erken aşamada) reddetmek.
- **Güvenli Temizlik:** İşlem tamamlanmadan iptal edilen durumlarda geçici dosyaların sistemde asılı (dangling) kalmamasını garanti altına almak.

## 2. Yapılan Değişiklikler

### A. Çok Katmanlı (Layered) Medya Doğrulaması (Backend)

`backend/services/file_storage.py` ve `backend/routers/video.py` güncellenerek güvenli upload akışı oluşturuldu:

1. **Uzantı (Extension) Kontrolü:** Yalnızca `ALLOWED_EXTENSIONS` (`.mp4`, `.mov`, `.webm`) kabul edilir.
2. **Content-Type Başlığı:** İstekle gelen MIME tipi yalnızca `video/mp4`, `video/quicktime`, `video/webm` listesinden doğrulanır.
3. **Magic-Byte İmzası (Signature):** Yüklenen verinin ilk 32 byte'ı okunur; içeriğin gerçekten bir WebM (`\x1a\x45\xdf\xa3`) veya MP4/MOV (`ftyp`, `moov`, `mdat` vs.) olup olmadığı denetlenir. Aksi halde Türkçe "Yüklenen dosya geçerli bir video değil." hatası verilir.
4. **Süre (Duration) Sınırı:** FFprobe, dosyanın `duration_seconds` değerini analiz eder. Sınırın (Normalde 60sn, Demo Modunda 5sn vb.) aşılması durumunda reddedilir ve disk temizlenir.
5. **Video Stream Analizi:** `FFmpegService.probe()` içerisinde salt ses dosyalarını engellemek adına medya içerisinde kesinlikle `codec_type == 'video'` olan bir stream aranır.

### B. Otomatik Test Kapsamı

`test_video_api.py` ve `test_public_demo_api.py` içerisindeki tüm testler magic-byte kontrollerinden başarıyla geçmesi için revize edildi:
- Test araçlarındaki mock `.write_bytes(b"video")` verileri `b"fake-video-ftyp-here"` yapılarak magic-byte imzasına uygun hale getirildi.
- Fazla uzun, hatalı stream'li veya yanlış content-type yüklemelerin 413 veya 415 döneceği spesifik olarak test edildi. Bütün `backend/tests/` yeşildir (Lip-Sync Local provider crash hatası hariç).

### C. Kullanıcı Deneyimi & Frontend Uyumluluğu

Frontend uygulamasındaki (`UploadZone.tsx`) görsel ve `accept` nitelikleri, backend beklentileriyle (ör. `"video/mp4,video/quicktime,video/webm"`) tam uyumludur. Geri dönen HTTP Status kodlarına göre frontend, kullanıcıya kibar bir uyarı (Örn. "Video süresi izin verilen sınırı aşıyor.") sunmaktadır.

## 3. Deployment ve Devreye Alma (Rollout)

- Bu işlem için veritabanı şemasında (Alembic) herhangi bir değişikliğe gerek duyulmadı.
- Mevcut `main` dalına (branch) entegre edildiğinde, hiçbir ek yapılandırma (environment variable) veya bağımlılık güncellemesine ihtiyaç duymadan Railway'de devreye alınabilir.
- Özellik şeffaf bir şekilde devreye girer (Feature flag yoktur, tüm yükleme taleplerine uygulanır).

## Sonraki Adımlar
Platformun upload süreci artık daha stabil ve kötüye kullanımlara (abuse) kapalıdır. Bundan sonraki aşamalarda (ör. Yorum/Beğeni akışları vb.) güvenlik seviyesi korunarak ilerlenebilir.
