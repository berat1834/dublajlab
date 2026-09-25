# İkinci Sprint — Profesyonel Kullanıcı Deneyimi

## Özet

Faz 2 kapsamında frontend, mevcut upload/process/download API sözleşmesi değiştirilmeden daha anlaşılır ve demo edilebilir bir ürün akışına dönüştürüldü. Masaüstünde kaynak video solda, kayıt editörü sağda, export sonucu altta kalıyor; küçük ekranlarda bölümler tek kolonda sıralanıyor. Job queue, auth, ödeme ve template sistemi bu sprintin dışında bırakıldı.

## Yapılan Değişiklikler

- Üç adımlı yükle–kaydet–indir yönlendirmesi ve daha belirgin ürün başlığı eklendi.
- Video yükleme alanı, doğrulama yükleme durumu ve boş editör görünümü geliştirildi.
- Backend bağlantısı, FFmpeg ve mikrofon hataları için bağlama özel Türkçe başlık ve çözüm yönlendirmeleri eklendi.
- Başarısız upload ve export işlemleri için önceki girdileri koruyan tekrar deneme aksiyonları eklendi.
- Timeline satırlarına kayıt bekliyor, kayıt devam ediyor ve kayıt tamamlandı durumları eklendi.
- Aktif/eksik/geçersiz replikler görsel olarak ayrıştırıldı; zaman alanları ve süre bilgisi okunaklı hale getirildi.
- Kayıt ilerleme çubuğu ve export düğmesinin neden kullanılamadığını açıklayan yardım metni eklendi.
- Mikrofon izni reddi, mikrofon bulunamaması ve aygıtın başka uygulamada kullanılması ayrı mesajlarla ele alındı.
- Tahmini export adımları, sonuç videosu, MP4 indirme, aynı videoyla yeniden deneme ve yeni videoya başlama aksiyonları eklendi.
- Klavye odak stilleri, azaltılmış hareket tercihi ve kaydırma çubuğu görünümü iyileştirildi.
- README'ye ekran görüntüsü/GIF placeholder'ı ve telifsiz içerik şartı eklendi.

## Değişen Dosyalar

- `frontend/src/App.tsx` — Ana ürün düzeni, durum panelleri, retry ve export sonucu
- `frontend/src/components/TimelineRecorder.tsx` — Timeline kayıt durumu, validasyon ve export yönlendirmesi
- `frontend/src/components/UploadZone.tsx` — Upload boş/hata durumu ve dosya koşulları
- `frontend/src/lib/api.ts` — Daha açıklayıcı bağlantı ve HTTP hata mesajları
- `frontend/src/index.css` — Arka plan, klavye odağı ve erişilebilir hareket stilleri
- `README.md` — Görsel/GIF placeholder ve telif notu
- `RAPOR.md` — İkinci Sprint kaydı

## Kapsam Dışı Bırakılanlar

- Backend mimarisi ve endpoint sözleşmeleri
- Job queue, kullanıcı hesabı/auth ve ödeme
- Hazır video/template sistemi
- Telifli veya üçüncü taraf demo medya dosyası

## Test Sonuçları

- Frontend ESLint: geçti
- TypeScript + Vite production build: geçti

- Backend Pytest: 23/23 geçti (gerçek FFmpeg entegrasyon testi dahil)
