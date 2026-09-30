# DublajLab Deployment Planı

> Tarih: 26 Eylül 2026
> Kapsam: Canlı production deployment mimarisi, kimlik doğrulama, yorumlar ve veritabanı kararları

## 1. Karar özeti

Meme Dublaj Studio MVP, artık bir kullanıcı kimlik doğrulama sistemine (Auth), kalıcı kullanıcılara, public projelere, beğeni ve yorumlara sahip olduğu için "Tam Platform" özelliklerine kavuşmuştur. Bu nedenle mimaride PostgreSQL kullanımı **şarttır**.

```text
Kullanıcı
   │
   ├── HTTPS → dublajlab.example
   │              └── Vercel: React/Vite statik frontend
   │
   └── HTTPS → api.dublajlab.example
                  └── Railway: FastAPI Docker servisi
                                ├── PostgreSQL Veritabanı
                                ├── FFmpeg / FFprobe
                                ├── memory job registry
                                └── /app/media Railway volume
```

- **Frontend:** Vercel, statik Vite deployment
- **Backend:** Railway, mevcut `backend/Dockerfile` ile
- **Veritabanı:** Railway PostgreSQL eklentisi
- **Medya:** Railway volume, `/app/media` mount noktası
- **Ölçek sınırı:** Bu mimari MVP için yeterlidir ancak uzun vadede medya depolama (S3/R2) ve kalıcı job kuyruğu (Redis/Celery) gerekecektir.
- **Lip-Sync Uyarısı:** Production Wav2Lip local open-source weights are not allowed for commercial VIP usage. Bu yüzden LIPSYNC_ENABLED env değişkeni canlı ortamda varsayılan olarak "false" bırakılmalıdır. İleride ayrı bir ticari API veya GPU worker yapılandırıldığında VIP için aktif edilebilir.

## 2. Ortam Değişkenleri ve Sırlar (Secrets)

Uygulamanın prodüksiyona çıkabilmesi için aşağıdaki güçlü sırlar tanımlanmalıdır:

```bash
# Ortam Tipi
APP_ENV=production

# Frontend Adresi (CORS)
ALLOWED_ORIGINS=https://dublajlab.vercel.app

# Railway PostgreSQL referansı; gerçek URL dashboard dışında paylaşılmaz
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT ve maintenance secret'ları yalnızca provider dashboard'a girilir
JWT_SECRET=<provider-dashboard-only-long-random-secret>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=4320
MAINTENANCE_TOKEN=<provider-dashboard-only-long-random-token>

# Railway runtime ve medya
RAILWAY_DOCKERFILE_PATH=backend/Dockerfile
MEDIA_ROOT=/app/media

# FFmpeg Yolları
FFMPEG_BINARY=ffmpeg
FFPROBE_BINARY=ffprobe

# Public demo
PUBLIC_DEMO_MODE=true
DEMO_MAX_FILE_SIZE_MB=20
DEMO_MAX_VIDEO_DURATION_SECONDS=30
DEMO_MAX_RECORDING_SIZE_MB=5
DEMO_MAX_EXPORTS_PER_IP_PER_DAY=5
DEMO_MEDIA_TTL_HOURS=6
TRUST_PROXY_HEADERS=false

# Lip-sync release güvenliği
LIPSYNC_ENABLED=false
LIPSYNC_PROVIDER=disabled
```

**Güvenlik Uyarısı:** `APP_ENV=production` iken `JWT_SECRET` varsayılan kalırsa uygulama `ValueError` fırlatacak ve güvenlik sebebiyle başlatılamayacaktır.

`APP_ENV=production` ile `LIPSYNC_PROVIDER=local` kombinasyonu, flag yanlışlıkla
açılsa dahi backend tarafından reddedilir. Production Wav2Lip local open-source
weights are not allowed for commercial VIP usage. `modal` ve `api` değerleri
yalnız gelecek adaptörleri için ayrılmıştır; gerçek çıktı sözleşmesi uygulanıp
onaylanana kadar fail-closed davranır.

## 3. Veritabanı Migration (Alembic)

Railway backend servisinde **Pre-deploy Command** alanı aşağıdaki değer olmalıdır:

```bash
python -m alembic -c /app/backend/alembic.ini upgrade head
```

Komut build tamamlandıktan sonra, yeni container trafiğe alınmadan önce çalışır. Migration başarısız olursa deployment yayına alınmamalıdır. Bu komut sayesinde `users`, `dubbing_projects`, `dubbing_exports`, `dubbing_likes`, `dubbing_comments` ve `content_reports` tabloları PostgreSQL'de kurulur. SQLite production'da kullanılmamalıdır.

İlk deployment ayarları:

- Dockerfile path: `backend/Dockerfile`
- Pre-deploy command: yukarıdaki Alembic komutu
- Healthcheck path: `/api/health`
- Volume mount path: `/app/media`
- Replica sayısı: `1` (memory job registry ve rate limiter nedeniyle)
- `PORT`: Railway tarafından sağlanır; repoya veya dashboard'a sabit secret olarak yazılmaz.

## 4. Vercel Frontend Ayarları

| Alan | Değer |
| --- | --- |
| Root Directory | `frontend` |
| Framework | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Environment | `VITE_API_BASE_URL=https://<railway-api-domain>` |
| Environment | `VITE_SHOPIER_VIP_URL=https://www.shopier.com/<vip-product>` |
| Environment | `VITE_VIP_PRICE_LABEL=₺199` |

`VITE_API_BASE_URL` secret değildir ve Vite build sırasında tarayıcı bundle'ına yazılır. Railway backend domain'i değişirse environment değeri güncellenip frontend yeniden deploy edilmelidir.

`VITE_SHOPIER_VIP_URL` ve `VITE_VIP_PRICE_LABEL` da build-time değerleridir.
Gerçek ödeme sonucu frontend dönüş parametresinden doğrulanmaz; webhook entegrasyonu
hazır olana kadar doğrulanmış sipariş yönetici endpoint'iyle manuel etkinleştirilir.

## 5. Upload Güvenliği ve Medya Doğrulaması (Production Upload Validation)

Kullanıcıların canlı ortama (Railway) dosya yüklediği `POST /api/video/upload` rotası, backend'i zararlı içeriklerden ve bozuk dosyalardan korumak için sıkı denetimlerden geçer:
- **Uzunluk ve Boyut Limitleri**: Hem dosya boyutu (MB) hem de medya süresi (sn) aktif profile göre doğrulanır. Limit aşıldığında dosya diskten silinir ve anında 413 hatası döner.
- **Magic-Byte ve Mime-Type**: `.ext` veya `Content-Type` kontrolüne ek olarak dosyanın ilk byte'ları okunur ve `ftyp` / `webm` mkv imza doğrulaması yapılır.
- **FFprobe Video Stream Kontrolü**: Dosya FFprobe tarafından derinlemesine okunur. İçinde gerçek bir `video` kanalı yoksa, sıfır saniyelik veya bozuksa dosya kabul edilmez.
- Geçersiz bir işlemde bırakılan geçici dosya `path.unlink(missing_ok=True)` ile derhal yok edilir.

## 6. Medya Temizliği (Cleanup) & Disk Tüketimi Riskleri

Platform, giriş yapmış (authenticated) kullanıcılar için "Kataloğum" altında oluşturulan export'ları saklar.
- MVP'deki `cleanup_service.py` genellikle demo videolarını (TTL bazlı) siler.
- **Risk**: Kullanıcı arşivleri silinmezse, disk (Railway Volume) çok hızlı dolabilir. Production'da disk dolması (Disk Full) API'nin tamamen durmasına neden olur.
- **Geçici Çözüm**: Cleanup politikasına kullanıcı export'ları için de bir yaşam süresi (ör. 30 gün) eklemek veya manuel kota kontrolü yapmak.
- **Kalıcı Çözüm**: AWS S3 veya Cloudflare R2'ye geçiş.

## 6. Dudak Senkronizasyonu Deployment Kararı

Railway mevcut FastAPI, FFmpeg ve normal export işleri için kullanılmaya devam
edebilir; ancak açık Wav2Lip modeli Railway backend içinde canlı VIP özelliği
olarak etkinleştirilmemelidir:

- Resmî açık kod ve ağırlıklar ticari kullanıma izin vermez.
- Mevcut image CPU-only'dir; gerçek inference süre ve bellek sınırlarını aşabilir.
- Model ağırlıkları Git/image içine alınmaz ve şu an Railway volume'a kurulmamıştır.
- Serverless webhook taslağı gerçek ticari inference sonucu dönene kadar production
  özelliği sayılmaz.

Production için ticari kullanım hakkı veren bir model/API seçilmeli; ağır işlem
ayrı GPU worker servisinde yürütülmeli ve FastAPI yalnız job orkestrasyonu ile
son FFmpeg export'unu yönetmelidir. Sağlayıcı anahtarı yalnız provider dashboard
secret'ı olarak tutulmalıdır.

## 7. Redis Cache ve Rate Limiting

Uygulamanın memory (RAM) üzerindeki bağımlılığını azaltmak ve IP bazlı günlük kotaları (Rate limit) ve Job durumlarını asenkron olarak saklamak için Redis kullanılır:
- **Redis Yoksa (Development)**: Sistem memory-fallback modunda çalışır, sunucu yeniden başlatılınca sayaclar ve yarım kalan işler silinir. Backend `redis_configured: false` döner ve sessizce çalışmaya devam eder.
- **Production (Railway)**: Railway projenizde "New -> Database -> Redis" diyerek bir Redis servisi oluşturun. Üretilen `REDIS_URL` (veya `REDIS_PRIVATE_URL`) env değişkenini backend servisinizin Variables sayfasına ekleyin ve deploy edin. `GET /api/health` adresinde `redis_connected: true` gördüğünüzde işlem tamamdır.

## 8. Deployment Adımları ve Checklist

Canlıya çıkış (Go-live) süreçleri için şu dökümanlara başvurun:
- `docs/LAUNCH_CHECKLIST.md` (Deployment öncesi ve sırası kontroller)
- `docs/PRODUCTION_SMOKE_TEST.md` (Sistemin canlıda çalıştığının onayı)

## 9. İlk Deneme Durumu — 26 Eylül 2026

Faz 22 ilk denemesi **partial deployment** olarak kaydedilmiştir. Sonraki
çalışmalarda Vercel frontend `https://dublajlab-sigma.vercel.app` adresinde
yayına alınmıştır. Tarihsel ilk deneme ayrıntıları için
[`docs/reports/sprint-22-first-deployment.md`](docs/reports/sprint-22-first-deployment.md)
belgesine bakın.
