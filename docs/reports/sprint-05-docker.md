# Beşinci Sprint — Docker + Local Production Setup

## Özet

Backend, frontend ve runtime medya klasörleri Docker Compose ile tekrarlanabilir bir local production ortamına taşındı. Uygulama kodunun upload, template, job queue, export ve download sözleşmeleri değiştirilmedi. Backend imajı FFmpeg/FFprobe ile birlikte gelir; frontend production bundle'ı Nginx üzerinden sunulur ve medya dosyaları named volume içinde container yaşam döngüsünden bağımsız tutulur.

## Backend Container

- `python:3.12-slim-bookworm` tabanı kullanıldı.
- FFmpeg paketi imaj içine kuruldu; aynı paket `ffprobe` aracını da sağlar.
- Python bağımlılıkları `backend/requirements.txt` üzerinden kuruldu.
- Uygulama root olmayan `appuser` kullanıcısıyla çalışacak şekilde ayarlandı.
- `MEDIA_ROOT=/app/media` tanımlandı ve bu yol volume mount noktası yapıldı.
- `/api/health` tabanlı container healthcheck eklendi.
- Memory job registry nedeniyle Uvicorn tek worker ile sınırlandı.

## Frontend Container

- Node 22 Alpine build stage içinde `npm ci` ve production build çalıştırılıyor.
- Build çıktısı Nginx Alpine runtime stage'ine kopyalanıyor.
- React istemci rotaları için SPA fallback ve statik asset cache ayarı eklendi.
- `VITE_API_BASE_URL` build arg olarak destekleniyor ve build-time davranışı README'de açıklandı.
- Nginx erişilebilirliği için container healthcheck eklendi.

## Docker Compose ve Runtime Verisi

- Backend `8000`, frontend `3000` host portunda yayınlanıyor.
- Backend production ortamında `/app/media` yolunu `dublajlab_media` named volume'una bağlıyor.
- CORS origin'i local Docker frontend adresi olan `http://localhost:3000` ile sınırlandı.
- Maintenance token `.env.docker` üzerinden zorunlu tutuldu; gerçek secret repoya eklenmedi.
- Frontend, sağlıklı backend koşuluna bağlı başlatılıyor.
- `.dockerignore`; sanal ortamı, dependency/build çıktılarını, Git metadata'yı, `.env` dosyalarını ve runtime medya dosyalarını build context dışında bırakıyor. Template metadata korunuyor.

## Değişen / Eklenen Dosyalar

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `docker-compose.yml`
- `.dockerignore`
- `.env.docker.example`
- `.gitignore`
- `README.md`
- `RAPOR.md`

## Kapsam Dışı Bırakılanlar

- Redis, Celery veya RQ
- Birden fazla backend worker ve dağıtık job registry
- Auth, ödeme ve deploy provider seçimi
- Gerçek production secret veya telifli medya

## Test ve Doğrulama Sonuçları

- Docker 28.4.0 ve Docker Compose 2.39.4 yerelde doğrulandı.
- `docker compose config` varsayılan ve alternatif port ayarlarıyla geçti.
- Backend ve frontend imajları gerçek olarak başarıyla build edildi.
- Backend ve frontend container healthcheck'leri `healthy` durumuna ulaştı.
- Backend `/api/health` yanıtı, template kataloğu, production CORS header'ı ve Nginx frontend yanıtı smoke testten geçti.
- Container içinde FFmpeg 5.1.9 ve FFprobe 5.1.9 doğrulandı; API medya araçlarını kullanılabilir bildirdi.
- Root olmayan `appuser` için `/app/media` named volume yazma izni ve runtime klasörleri doğrulandı.
- Host backend Pytest: 41/41 geçti; gerçek FFmpeg timeline entegrasyon testi dahildir.
- Frontend ESLint: geçti.
- TypeScript + Vite production build: geçti.
- İlk varsayılan port denemesinde kullanıcıya ait mevcut `book_tracker_api` container'ı 8000 portunu kullandığı için stack başlatılmadı. Bu servise dokunulmadan Compose portları yapılandırılabilir hale getirildi ve smoke test 13000/18000 portlarında başarıyla tamamlandı.
