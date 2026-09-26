# Faz 22 — First Production Deployment Attempt

> Tarih: 26 Eylül 2026
> Durum: **Partial deployment — production URL oluşturulmadı**

## Amaç

DublajLab'ı Railway backend + PostgreSQL + `/app/media` volume ve Vercel frontend mimarisiyle ilk kez gerçek hosting ortamına taşımak; yeni ürün özelliği eklemeden deployment engellerini tespit etmek ve belgelemek.

## GitHub ve CI Durumu

- Yerel `main`, `origin/main` ve GitHub `main` aynı committe doğrulandı: `6e9be77`.
- Son GitHub Actions çalışması başarısız: [CI run 36226521135](https://github.com/berat1834/dublajlab/actions/runs/36226521135).
- Frontend CI adımları geçti: install, lint, build ve production audit.
- Backend CI, auth şemalarının ihtiyaç duyduğu `email-validator` dependency'si eksik olduğu için test import aşamasında başarısız oldu.
- Çalışma ağacında Faz 16–21'e ait çok sayıda commitlenmemiş dosya bulundu. Bu dosyalar GitHub `main` üzerinde olmadığı için provider deployment başlatılmadı.

## Karşılaşılan Hatalar ve Çözümler

| Adım | Hata | Çözüm / Durum |
| --- | --- | --- |
| Backend test import | `email-validator is not installed` | `email-validator` requirements'a eklendi. |
| Railway PostgreSQL hazırlığı | PostgreSQL DBAPI driver yoktu | `psycopg2-binary` requirements'a eklendi. |
| Alembic | Ara migration `users` tablosunu düşürüyordu | Revision veri değiştirmeyen no-op yapıldı; sonraki migration'dan `users` yeniden oluşturma/silme adımları çıkarıldı. |
| Public optional auth | Senkron auth fonksiyonu `await` ediliyordu | Senkron çağrı ve dar `HTTPException` yakalama kullanıldı. |
| Yorum/admin UTC zamanı | Windows'ta `ZoneInfo("UTC")` bulunamadı | Standart `datetime.timezone.utc` kullanıldı. |
| Railway runtime | Container sabit `8000` portunu dinliyordu | Docker CMD ve healthcheck Railway'in sağladığı `PORT` değişkenine bağlandı. |
| Production CORS | `PATCH` ve `DELETE` izinli değildi | Gerekli HTTP metotları açıkça allowlist'e eklendi. |
| Railway CLI ilk indirme | npm `ECONNRESET` | İkinci denemede CLI indirildi; oturumun kapalı olduğu doğrulandı. |
| Provider authentication | Railway ve Vercel oturumları kapalı | Railway browserless login başlatıldı; kullanıcı onayı bekleniyor. Vercel login henüz tamamlanmadı. |

## Alembic Stratejisi

Railway backend servisinde aşağıdaki komut **Pre-deploy Command** olarak çalıştırılacaktır:

```bash
python -m alembic -c /app/backend/alembic.ini upgrade head
```

Migration başarısız olursa deployment yayına alınmamalıdır. Alembic `script_location`, çalışma dizininden bağımsız olması için `%(here)s/alembic` olarak güncellendi.

## Yerel Doğrulamalar

- Backend pytest: **68/68 passed**.
- Frontend ESLint: **passed**.
- TypeScript + Vite production build: **passed**.
- Fresh SQLite migration: `330e75449567` → `bc2a9e7650d6 (head)` **passed**.
- `docker compose --env-file .env.docker.example config --quiet`: **passed**.
- Backend Docker image build: **passed**.
- Geçici production container healthcheck: **healthy**.
- Container içi Alembic upgrade: **passed**.
- `/api/health`: **passed**.
- `/api/system/ffmpeg`: FFmpeg kullanılabilir.
- `/api/system/demo-policy`: public demo policy aktif ve beklenen TTL ile döndü.
- `/docs`: HTTP 200.
- Register, login ve `/api/auth/me`: **passed**.
- Template listesi: **passed**.
- Vercel origin'i için `PATCH` preflight: HTTP 200; `GET, POST, PATCH, DELETE, OPTIONS` döndü.

Bu kontroller yalnızca local pre-deploy doğrulamasıdır; gerçek production smoke testi olarak değerlendirilmemiştir.

## Provider Tarafında Tamamlanmayanlar

- Railway project oluşturma
- Railway PostgreSQL service oluşturma
- Backend service'i GitHub/Dockerfile ile bağlama
- `/app/media` volume bağlama
- Dashboard environment variable ve secret girişleri
- Railway domain üretme ve production backend smoke testi
- Vercel project oluşturma ve `frontend` root ayarı
- `VITE_API_BASE_URL` tanımlama ve production frontend deploy
- Vercel domain'ini Railway `ALLOWED_ORIGINS` değerine ekleme
- Tam production smoke akışı: upload, record, export, catalog, public feed, like, comment, report, admin hide ve logout

## Güvenlik Notu

Repoya gerçek JWT secret, maintenance token, Railway database URL veya provider token yazılmadı. Yerel container smoke testinde kullanılan değerler yalnızca geçici test değerleriydi ve container durdurulunca silindi.

## Devam Etmeden Önce

1. Faz 16–21 çalışma ağacının hangi commit/branch stratejisiyle GitHub'a gönderileceği belirlenmeli.
2. CI tamamen yeşil olmalı.
3. Railway ve Vercel hesap girişleri kullanıcı tarafından tamamlanmalı.
4. Provider kaynakları oluşturulduktan sonra gerçek URL'lerle `docs/PRODUCTION_SMOKE_TEST.md` eksiksiz uygulanmalı.

## Resmî Referanslar

- [Railway CLI login](https://docs.railway.com/cli/login)
- [Railway custom Dockerfile path](https://docs.railway.com/builds/dockerfiles)
- [Railway pre-deploy command](https://docs.railway.com/deployments/pre-deploy-command)
- [Railway healthchecks and PORT](https://docs.railway.com/deployments/healthchecks)
- [Railway volumes](https://docs.railway.com/volumes)
- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
