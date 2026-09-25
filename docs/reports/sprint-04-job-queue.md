# Dördüncü Sprint — Job Queue ve Gerçek Progress

## Özet

Video export akışı yeni frontend için senkron HTTP bekleyişinden çıkarılıp job tabanlı hale getirildi. Export başlangıcı `202 Accepted` ile bir `job_id` döndürüyor; medya işleme FastAPI background task içinde devam ederken frontend job endpoint'ini poll ederek gerçek backend aşamalarını, yüzdeyi ve sonucu izliyor. Redis/Celery eklenmedi; servis katmanı ileride kalıcı bir queue adaptörüne taşınabilecek biçimde ayrıldı.

## Backend Değişiklikleri

- `queued`, `processing`, `completed` ve `failed` değerlerine sahip `JobStatus` modeli eklendi.
- Progress, mesaj, çıktı kimliği, indirme bağlantısı ve hata alanlarını taşıyan `JobResponse` eklendi.
- Thread-safe, memory tabanlı `JobRegistry` oluşturuldu.
- AI ve mikrofon export worker'ları `DubbingJobService` içinde servis katmanına ayrıldı.
- `POST /api/jobs/dubbing-recordings` endpoint'i eklendi.
- `POST /api/jobs/dubbing-ai` endpoint'i eklendi.
- `GET /api/jobs/{job_id}` polling endpoint'i ve Türkçe 404 yanıtı eklendi.
- Mikrofon kayıtları request kapanmadan diske kaydediliyor; worker sonunda geçici kayıt/altyazı/ses dosyaları temizleniyor.
- Mevcut `/api/video/process` ve `/api/video/process-recordings` endpoint'leri geriye uyumluluk için korunuyor.

## Frontend Değişiklikleri

- Mikrofon ve AI export çağrıları yeni job endpoint'lerine geçirildi.
- Bir saniyelik, iptal edilebilir job polling eklendi.
- Sahte zaman tabanlı ilerleme mesajları kaldırıldı.
- Backend'den dönen gerçek status mesajı ve progress yüzdesi gösteriliyor.
- `failed` durumunda backend hata mesajı mevcut retry akışına bağlandı.
- `completed` durumunda mevcut video preview ve MP4 download ekranı korunuyor.
- Sayfa/akış resetlendiğinde aktif polling isteği iptal ediliyor.

## Test Kapsamı

- AI job oluşturma ve queued yanıtı
- Mikrofon kaydı job oluşturma
- Polling ile processing durumunu okuma
- Worker'ın completed durumu ve geçici dosya temizliği
- Worker hata durumunun failed olarak kaydedilmesi
- Completed job download URL'i
- Bilinmeyen job için Türkçe 404
- Mevcut gerçek FFmpeg timeline entegrasyon testi

## Bilinen Sınırlar

- Registry bellektedir; backend restart durumunda job durumları kaybolur.
- Birden fazla uygulama worker'ı registry paylaşmaz.
- BackgroundTasks kalıcı bir broker değildir; process çökmesi halinde aktif job devam etmez.
- FFmpeg çalışırken progress aşama bazlıdır; frame düzeyinde yüzde telemetrisi yoktur.
- Production ölçeği için Redis/Celery veya RQ, retry/backoff, job TTL ve concurrency limiti gerekir.

## Değişen / Eklenen Dosyalar

- `backend/models.py`
- `backend/main.py`
- `backend/routers/jobs.py`
- `backend/services/job_service.py`
- `backend/tests/test_jobs_api.py`
- `frontend/src/types.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/App.tsx`
- `README.md`
- `RAPOR.md`

## Test Sonuçları

- Backend Pytest: 41/41 geçti (gerçek FFmpeg entegrasyon testi dahil)
- Frontend ESLint: geçti
- TypeScript + Vite production build: geçti
