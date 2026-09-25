# Altıncı Sprint — Public Demo Safety + Rate Limit + Cleanup Policy

## Özet

Public demo yayını öncesinde upload, mikrofon kaydı, export kullanımı ve medya saklama süresi sınırlandırıldı. Normal local kullanımın mevcut 50 MB video, 60 saniye süre ve 10 MB kayıt limitleri korunurken public demo modu daha düşük değerleri environment üzerinden uygular. Mevcut template, job queue, senkron geriye uyumluluk ve Docker akışları korunmuştur.

## Backend Değişiklikleri

- `PUBLIC_DEMO_MODE` ve beş public demo limit ayarı eklendi.
- Public demo limitleri normal uygulama limitlerini yükseltemeyecek şekilde sınırlandı.
- Upload dosya boyutu, video süresi ve replik kaydı boyutu runtime policy'ye bağlandı.
- UTC takvim günü bazlı, thread-safe ve memory tabanlı `DailyExportRateLimiter` servisi eklendi.
- Rate limit hem yeni mikrofon/AI job endpoint'lerine hem eski senkron process endpoint'lerine uygulandı.
- Kota aşımında Türkçe `429` ve `Retry-After`, medya limiti aşımında Türkçe `413` yanıtları korunuyor.
- `X-Forwarded-For` varsayılan olarak güvenilmez kabul edildi; yalnızca `TRUST_PROXY_HEADERS=true` olduğunda ve geçerli IP içerdiğinde kullanılıyor.
- `GET /api/system/demo-policy` endpoint'i ile etkin limitler frontend'e açıldı.
- Cleanup isteğinde `older_than_hours` verilmezse public demo için `DEMO_MEDIA_TTL_HOURS`, normal mod için 24 saat kullanılıyor.
- Maintenance token kontrolü değiştirilmedi.

## Frontend Değişiklikleri

- Backend demo policy başlangıçta okunuyor.
- Public demo etkinse video, süre, kayıt, günlük export ve TTL değerlerini gösteren bilgi paneli ekleniyor.
- Yükleme alanı backend ile aynı dosya ve süre değerlerini gösterip dosya boyutunu istemci tarafında doğruluyor.
- Günlük kota ve medya boyutu hataları için anlaşılır Türkçe başlık/yönlendirme eklendi.
- “Bu public demo dosyalarınızı kalıcı olarak saklamaz” mesajı görünür hale getirildi.

## Cleanup ve Proxy Politikası

- README'ye tokenlı cron örneği, Docker named volume saklama davranışı ve geri alınamaz volume silme uyarısı eklendi.
- Güvenilir proxy'nin dış istemci header'ını silip yeniden yazması ve backend'in doğrudan internete kapatılması şartları belgelendi.
- Memory limiter'ın restartta sıfırlandığı ve worker/container'lar arasında paylaşılmadığı açıklandı.
- Çoklu instance için Redis benzeri ortak rate-limit deposunun ileride gerekli olduğu kaydedildi; bu sprintte Redis/Celery eklenmedi.

## Değişen / Eklenen Dosyalar

- `backend/config.py`
- `backend/main.py`
- `backend/models.py`
- `backend/routers/video.py`
- `backend/routers/jobs.py`
- `backend/routers/maintenance.py`
- `backend/services/file_storage.py`
- `backend/services/rate_limit_service.py`
- `backend/tests/test_rate_limit_service.py`
- `backend/tests/test_public_demo_api.py`
- `frontend/src/types.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/UploadZone.tsx`
- `frontend/src/App.tsx`
- `backend/.env.example`
- `.env.docker.example`
- `docker-compose.yml`
- `README.md`
- `RAPOR.md`

## Kapsam Dışı Bırakılanlar

- Auth, kullanıcı hesabı ve ödeme
- Redis/Celery/RQ veya dağıtık rate limiter
- Deploy provider seçimi
- Otomatik scheduler container'ı
- Secret veya telifli medya dosyası

## Test ve Doğrulama Sonuçları

- Backend Pytest: 51/51 geçti.
- Gerçek FFmpeg timeline entegrasyon testi geçti.
- Rate limiter limit/sıfırlama ve güvenli proxy testleri geçti.
- Public demo upload, kayıt, video süresi, export 429 ve normal mod regresyon testleri geçti.
- TTL cleanup varsayılanı testi geçti.
- Frontend ESLint geçti.
- TypeScript + Vite production build geçti.
- Docker Compose config geçti.
- Güncel backend/frontend Docker imajları build edildi.
- Public demo modu açık container smoke testinde iki servis `healthy`, policy endpoint'i doğru, FFmpeg hazır, frontend 200 ve CORS doğru bulundu.
