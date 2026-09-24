# DublajLab Geliştirme Raporu

## Özet

Profesyonel ürünleştirme planının yalnızca **İlk Sprint Görevleri** uygulanmıştır. Mevcut video yükleme, mikrofonla replik kaydı, AI ses, FFmpeg export, preview ve download akışları korunmuştur. Bu sprint; medya işlemi timeout'ları, production maintenance güvenliği, proje dokümantasyonu, lisans ve sürekli entegrasyon temellerine odaklanmıştır.

Mevcut mimari kısa teknik inceleme sonucunda servis sorumlulukları bakımından uygun bulunmuştur: HTTP akışı router katmanında, dosya/FFmpeg/TTS/altyazı/temizlik işleri ayrı servislerde, tarayıcı kayıt akışı ise bağımsız React bileşeninde tutulmaktadır. Ayrıntılı not `docs/TEKNIK_NOT.md` içindedir.

## Yapılan Değişiklikler

### 1. FFmpeg timeout koruması

- Genel FFmpeg process timeout'u 180 saniye olarak eklendi.
- FFprobe timeout'u 30 saniye olarak eklendi.
- Timeout durumunda kullanıcıya Türkçe ve uygulanabilir hata mesajı dönülüyor.
- Timeout yolu birim testle güvenceye alındı.

### 2. Maintenance endpoint güvenliği

- `APP_ENV` ve `MAINTENANCE_TOKEN` ortam değişkenleri eklendi.
- Backend, `backend/.env` ve proje kökündeki `.env` dosyasını destekliyor; süreç ortamı önceliğini koruyor.
- Token tanımlıysa `X-Maintenance-Token` header'ı zorunlu hale getirildi.
- Token yoksa cleanup yalnızca `development`, `dev`, `local` ve `test` ortamlarında çalışıyor.
- Production ortamında token yoksa endpoint işlem yapmadan `503` döndürüyor.
- Token karşılaştırması zamanlama saldırılarına karşı `hmac.compare_digest` ile yapılıyor.
- Token eksik, doğru token ve production yapılandırma yolları test edildi.

### 3. Profesyonel repo paketi

- README'ye CI/lisans/teknoloji badge'leri, hızlı bağlantılar ve Mermaid mimari diyagramı eklendi.
- Environment, maintenance güvenliği, timeout, veri saklama ve cron önerileri güncellendi.
- Kısa teknik mimari notu eklendi.
- MIT lisansı eklendi.
- GitHub Actions üzerinde backend ve frontend job'ları eklendi.
- CI; `main`, `dev`, `Berat` push'larında ve `main`/`dev` pull request'lerinde çalışacak şekilde yapılandırıldı.
- Backend CI gerçek FFmpeg entegrasyon testini, frontend CI lint/build/audit kontrollerini çalıştırıyor.

## Değişen Dosyalar

- `.github/workflows/ci.yml` — Backend/frontend CI pipeline'ı
- `LICENSE` — MIT lisansı
- `README.md` — Profesyonel proje sunumu, mimari, güvenlik ve CI dokümantasyonu
- `docs/TEKNIK_NOT.md` — Kısa teknik mimari ve risk notu
- `backend/.env.example` — `APP_ENV` ve `MAINTENANCE_TOKEN`
- `backend/config.py` — `.env` yükleme ve ortam yardımcıları
- `backend/requirements.txt` — Doğrudan `python-dotenv` bağımlılığı
- `backend/routers/maintenance.py` — Token ve ortam tabanlı erişim kontrolü
- `backend/services/ffmpeg_service.py` — FFmpeg/FFprobe timeout'ları
- `backend/tests/test_system_api.py` — Maintenance güvenlik testleri
- `backend/tests/test_video_api.py` — Timeout testi
- `RAPOR.md` — Sprint sonuç raporu

Talimat kaynağı olan `DublajLab_Profesyonel_Urunlestirme_Prompt.md` değiştirilmemiştir. İkinci ve sonraki fazlara ait özellikler bu sprintte kodlanmamıştır.

## Test Sonuçları

| Kontrol noktası | Backend | Frontend lint | Frontend build | Ek kontrol |
| --- | ---: | ---: | ---: | --- |
| FFmpeg timeout sonrası | 20/20 geçti | Geçti | Geçti | Gerçek FFmpeg export geçti |
| Maintenance token sonrası | 23/23 geçti | Geçti | Geçti | Production erişim yolları geçti |
| README/Lisans/CI sonrası | 23/23 geçti | Geçti | Geçti | CI YAML parse geçti |

Backend paketinde yalnızca Starlette TestClient'in AnyIO alias kullanımına ait upstream deprecation uyarısı bulunmaktadır; test başarısını etkilememektedir.

## Bilinen Riskler

- Video işleme hâlâ senkron HTTP isteği içinde çalışır; yoğun trafik ve uzun export için job queue gerekir.
- Upload/output TTL temizliği manuel endpoint ve dış cron/zamanlanmış görev sorumluluğundadır.
- Dosya doğrulaması uzantı ve FFprobe kullanır; ayrıca magic-byte/MIME imza kontrolü henüz yoktur.
- Maintenance token tek paylaşılan secret'tır; public dağıtımda HTTPS, secret manager ve rate limit ile desteklenmelidir.
- Edge TTS harici bir servistir; ağ veya sağlayıcı değişiklikleri AI ses modunu geçici etkileyebilir.
- GitHub Actions dosyası yerelde parse edilmiştir; ilk gerçek hosted CI sonucu push/PR sonrasında görülmelidir.

## Sonraki 5 Adım

1. Yeni CI workflow'unu GitHub üzerinde çalıştırıp yeşil sonucu README badge'iyle doğrulamak.
2. Upload akışına magic-byte/MIME imza doğrulaması eklemek.
3. Cleanup endpoint'ini production zamanlanmış görevine bağlayıp saklama süresini UI'da göstermek.
4. Export hata/retry ve tahmini işlem adımı UX'ini iyileştirmek.
5. Açık lisanslı demo/template altyapısına geçmeden önce lisans metadata sözleşmesini tasarlamak.

---

## İkinci Sprint — Profesyonel Kullanıcı Deneyimi

### Özet

Faz 2 kapsamında frontend, mevcut upload/process/download API sözleşmesi değiştirilmeden daha anlaşılır ve demo edilebilir bir ürün akışına dönüştürüldü. Masaüstünde kaynak video solda, kayıt editörü sağda, export sonucu altta kalıyor; küçük ekranlarda bölümler tek kolonda sıralanıyor. Job queue, auth, ödeme ve template sistemi bu sprintin dışında bırakıldı.

### Yapılan Değişiklikler

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

### Değişen Dosyalar

- `frontend/src/App.tsx` — Ana ürün düzeni, durum panelleri, retry ve export sonucu
- `frontend/src/components/TimelineRecorder.tsx` — Timeline kayıt durumu, validasyon ve export yönlendirmesi
- `frontend/src/components/UploadZone.tsx` — Upload boş/hata durumu ve dosya koşulları
- `frontend/src/lib/api.ts` — Daha açıklayıcı bağlantı ve HTTP hata mesajları
- `frontend/src/index.css` — Arka plan, klavye odağı ve erişilebilir hareket stilleri
- `README.md` — Görsel/GIF placeholder ve telif notu
- `RAPOR.md` — İkinci Sprint kaydı

### Kapsam Dışı Bırakılanlar

- Backend mimarisi ve endpoint sözleşmeleri
- Job queue, kullanıcı hesabı/auth ve ödeme
- Hazır video/template sistemi
- Telifli veya üçüncü taraf demo medya dosyası

### Test Sonuçları

- Frontend ESLint: geçti
- TypeScript + Vite production build: geçti
- Backend Pytest: 23/23 geçti (gerçek FFmpeg entegrasyon testi dahil)
