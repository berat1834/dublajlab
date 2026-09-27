# Sprint 28: Wav2Lip AI Model Integration

## Kapsam ve Yapılan Değişiklikler
Bu sprintte, mevcut simülasyon ( `asyncio.sleep` temelli mock) yerine, gerçek **Wav2Lip** (Dudak Senkronizasyonu) çıkarım altyapısı (inference pipeline) projeye entegre edildi.

1. **Backend Ortamı ve Bağımlılıkları**:
   - `backend/Dockerfile` güncellenerek OpenCV ve AI işlemleri için gerekli sistem bağımlılıkları (`libgl1-mesa-glx`, `libglib2.0-0`) eklendi.
   - `backend/requirements.txt` dosyasına yapay zeka modelinin çalışması için gereken Python kütüphaneleri eklendi: `torch`, `torchvision`, `torchaudio`, `opencv-python`, `librosa`, `numpy`.

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
   - Frontend ve UI dokunulmadan korundu. (Linting ve build başarıyla test edildi).

## Bilinen Riskler ve Notlar
> ⚠️ **Uyarı**: Sistem CPU üzerinde çalışmaktadır, GPU hızlandırması (CUDA) yapılandırılmamıştır. Yüksek çözünürlüklü videolarda işlem süresi çok uzun olabilir.
