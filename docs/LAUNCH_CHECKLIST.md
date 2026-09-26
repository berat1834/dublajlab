# Launch Checklist

Canlıya çıkmadan önce aşağıdaki adımların eksiksiz tamamlandığından emin olun.

## Pre-deploy
- [ ] Railway/Vercel (veya benzeri) platform hesapları hazır mı?
- [ ] Domain yönlendirmeleri (DNS) yapıldı mı?
- [ ] GitHub `main` temiz, güncel ve CI tamamen yeşil mi?
- [ ] Railway backend servisinde Dockerfile path `backend/Dockerfile` olarak ayarlandı mı?
- [ ] Railway healthcheck path `/api/health` olarak ayarlandı mı?

## Secrets & Config
- [ ] `APP_ENV` değişkeni `production` olarak ayarlandı mı?
- [ ] Güçlü, rastgele bir `JWT_SECRET` üretildi mi?
- [ ] `DATABASE_URL` bir PostgreSQL veritabanını işaret ediyor mu?
- [ ] `ALLOWED_ORIGINS` gerçek domain(ler) ile sınırlandırıldı mı?
- [ ] Vercel üzerinde `VITE_API_BASE_URL` doğru API domain'ini gösteriyor mu?

## DB & Medya
- [ ] Railway'de PostgreSQL servisi eklendi ve bağlandı mı?
- [ ] İlk deploy sonrası `alembic upgrade head` başarıyla çalıştı mı?
- [ ] Railway Pre-deploy Command `python -m alembic -c /app/backend/alembic.ini upgrade head` olarak ayarlandı mı?
- [ ] Medya için Railway Volume (ör. `/app/media` hedefine) bağlandı mı?
- [ ] Cleanup cron-job'u (demo ve log temizliği için) kurgulandı mı?

## CORS & HTTPS
- [ ] Frontend ve Backend HTTPS üzerinden çalışıyor mu?
- [ ] Frontend üzerinden yapılan API çağrılarında CORS hatası alınıyor mu?

## Admin & Roller
- [ ] Sisteme ilk kayıt olan (veya manuel DB müdahalesiyle) bir hesabın rolü `admin` yapıldı mı?
- [ ] Admin hesabı ile Moderasyon Paneli'ne erişilebiliyor mu?

## Fallback & Rollback
- [ ] Deployment hatalarına karşı rollback planı net mi? (Örn: Vercel "Revert", Railway "Redeploy previous")
- [ ] Database backup politikası (Railway otomatik backup) devrede mi?
