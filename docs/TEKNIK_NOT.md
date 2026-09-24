# DublajLab kısa teknik not

## Sistem özeti

DublajLab, React tarayıcı istemcisi ile FastAPI medya backend'inden oluşur. Kullanıcı videosu ve replik kayıtları multipart isteklerle backend'e aktarılır. Backend kaynak videoyu FFprobe ile doğrular, kayıtları timeline zamanlarına göre FFmpeg filter graph'ına yerleştirir, ASS altyazıyı gömer ve H.264/AAC MP4 üretir.

## Sorumluluklar

- `frontend/src/App.tsx`: upload, mod seçimi, process ve çıktı akışının üst seviye durumu
- `frontend/src/components/TimelineRecorder.tsx`: timeline düzenleme ve MediaRecorder yaşam döngüsü
- `backend/routers/video.py`: video HTTP sözleşmesi ve istek validasyonu
- `backend/services/ffmpeg_service.py`: FFprobe analizi, güvenli argüman listeleri ve medya export'u
- `backend/services/file_storage.py`: UUID tabanlı dosya/metadata saklama
- `backend/services/subtitle_service.py`: zamanlanmış ASS altyazı ve watermark
- `backend/services/tts_service.py`: ikincil Edge TTS modu
- `backend/services/cleanup_service.py`: bilinen runtime klasörlerinde yaşa bağlı manuel temizlik

## Güvenlik ve dayanıklılık sınırları

- Upload 50 MB ve 60 saniye ile sınırlıdır; uzantı kontrolünden sonra FFprobe doğrulaması yapılır.
- Dosya adları doğrudan storage yolu olarak kullanılmaz; UUID üretilir.
- FFprobe 30, FFmpeg process 180 saniyede timeout olur.
- Maintenance endpoint production'da token olmadan çalışmaz.
- Geçici ses, altyazı ve mikrofon kayıtları process sonunda silinir.
- Kaynak ve çıktıların TTL temizliği manuel endpoint üzerinden yapılır; kalıcı saklama garantisi yoktur.
- Medya işlemleri şu an senkrondur; yoğun trafik için job queue sonraki sprint konusudur.

## Test yüzeyi

Pytest paketi API validasyonunu, token kurallarını, cleanup davranışını, timeout yolunu, FFmpeg komut yapısını ve kurulu FFmpeg ile gerçek MP4 export'unu kapsar. Frontend TypeScript build ve ESLint ile doğrulanır. Aynı kontroller GitHub Actions üzerinde tekrar edilir.

