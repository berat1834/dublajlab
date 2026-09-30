# Sprint 28: Wav2Lip AI Model Integration

## Kapsam ve Yapılan Değişiklikler
Bu sprintte, mevcut simülasyon ( `asyncio.sleep` temelli mock) yerine, gerçek **Wav2Lip** (Dudak Senkronizasyonu) çıkarım altyapısı (inference pipeline) projeye entegre edildi.

1. **Backend Ortamı ve Bağımlılıkları**:
   - `backend/Dockerfile` güncellenerek OpenCV ve AI işlemleri için gerekli sistem bağımlılıkları (`libgl1-mesa-glx`, `libglib2.0-0`) eklendi.
   - `backend/requirements.txt` dosyasına yapay zeka modelinin çalışması için gereken Python kütüphaneleri eklendi: `torch`, `torchvision`, `torchaudio`, `opencv-python`, `librosa`, `numpy`.
   - CPU hedefiyle uyumlu PyTorch paketleri sabitlendi; Docker build sırasında gereksiz CUDA paketlerinin indirilmesi engellendi.

2. **Model Ağırlıkları (Weights) Yönetimi**:
   - `backend/weights/` dizini oluşturuldu.
   - İçerisine model dosyalarının nasıl ekleneceğini belirten bir `README.md` ile klasör yapısını Git üzerinde tutmak için boş `.gitkeep` dosyası eklendi.
   - Yüksek boyutlu `.pth` model ağırlıklarının yanlışlıkla Git deposuna pushlanmasını önlemek için `.gitignore` dosyasına `backend/weights/*.pth` kuralı eklendi.

3. **Servis Katmanı (lip_sync_service.py)**:
   - Yeni bir `LipSyncService` servisi yazılarak `wav2lip_gan.pth` ve `s3fd.pth` dosyalarının sistemdeki varlığı kontrol edildi.
   - Dosyalar eksikse kullanıcıya güvenli bir şekilde: *"Dudak senkronizasyonu model dosyaları sunucuda bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin."* hatası döndürüldü.
   - Dosyalar mevcutsa `subprocess` kullanılarak Python üzerinden Wav2Lip çıkarım (`inference.py`) komutunu asenkron başlatan try-except mimarisi eklendi. Çökme durumlarında Türkçe hata mesajlarıyla süreç kontrol altına alındı.

4. **Test ve Doğrulama**:
   - Python bağımlılıklarının yüklenebildiğini ve `LipSyncService` hata yönetiminin (dosyalar yokken doğru hatayı fırlattığı) çalıştığını doğrulayan `backend/tests/test_lip_sync.py` yazıldı (Pytest).
   - Yerel inference komutunun doğru Python yorumlayıcısı, model, video, ses ve çıktı argümanlarıyla kurulduğu subprocess çalıştırmadan birim testle doğrulandı.
   - Backend testleri, frontend test/lint/build, npm audit ve CPU-only backend Docker build kontrolleri çalıştırıldı.
   - Frontend ve UI dokunulmadan korundu. (Linting ve build başarıyla test edildi).

### Son doğrulama sonuçları

- Backend pytest: 92/92 geçti.
- Hedefli Wav2Lip testleri: 6/6 geçti.
- Frontend Vitest: 5/5 geçti.
- Frontend ESLint: geçti.
- TypeScript/Vite production build: geçti.
- npm audit: 0 güvenlik açığı.
- Backend Docker image: CPU-only PyTorch ile build edildi.
- Container AI import smoke testi: geçti (`torch`, `torchvision`, `torchaudio`, `cv2`, `librosa`, `numpy`).

## Export akışı bağlantısı

`apply_lip_sync` seçeneği güncel job mimarisine yeniden bağlandı. AI ses ve
mikrofon export endpoint'leri seçeneği kabul eder; Free kullanıcılar backend
seviyesinde Türkçe `403` ile engellenir. Mikrofon modunda bütün kayıtlar önce
replik zamanlarına göre tek bir geçici WAV dosyasında birleştirilir. Lip-sync
çıktısı daha sonra mevcut FFmpeg mix, altyazı, watermark ve indirme akışından
geçer. Frontend her iki modda deneysel toggle ve gerçek job progress mesajlarını
gösterir.

## Bilinen Riskler ve Notlar
> ⚠️ **Uyarı**: Sistem CPU üzerinde çalışmaktadır, GPU hızlandırması (CUDA) yapılandırılmamıştır. Yüksek çözünürlüklü videolarda işlem süresi çok uzun olabilir.

> ⚠️ **Lisans**: Resmî açık Wav2Lip kodu ve model ağırlıkları yalnız kişisel,
> akademik ve araştırma kullanımı içindir. Ticari/VIP production kullanımında
> etkinleştirilmemeli; ticari lisanslı alternatif seçilmelidir.

Gerçek inference testi repoya model veya medya eklenmeden hazırlanmıştır; ancak
bu çalışma ortamında gerekli iki `.pth` ağırlığı ve kullanıcıya ait yüz videosu
bulunmadığı için gerçek model çıktısı üretildiği iddia edilmemektedir. Servis,
eksik model/motor durumunu kullanıcıya anlaşılır Türkçe job hatası olarak döndürür.
