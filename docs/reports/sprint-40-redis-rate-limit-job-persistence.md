# Sprint 40 Raporu: Redis-Based Rate Limit + Job Registry Persistence

**Tarih:** 26 Eylül 2026 (Tahmini)
**Durum:** Tamamlandı

## 1. Hedefler
Mevcut memory-based `job registry` ve `rate limit` yapılarını production (Railway) ortamı için daha dayanıklı (persistent) ve ölçeklenebilir hale getirmek. Sunucu re-start (yeniden başlatma) işlemlerinde veya tek bir instance sınırları aşıldığında aktif verilerin (sayaçlar, kuyruklar) kaybedilmesini azaltmak.

## 2. Yapılan Değişiklikler

### A. Altyapı ve Konfigürasyon
- **Bağımlılık Eklendi:** Asenkron `redis.asyncio` altyapısı sağlayabilmek adına `redis>=4.5.5` Python bağımlılığı `backend/requirements.txt` içine eklendi.
- **Docker Compose:** Geliştirme ortamında çalışmayı kolaylaştırmak için `docker-compose.yml` dosyasına `redis:7-alpine` servisi dahil edildi. `backend` konteyneri `REDIS_URL` değişkeni ile başlatıldı.
- **Konfigürasyon (config.py):** `get_redis_url()` fonksiyonu tanımlandı. Production ortamında env (`REDIS_URL`) tanımlanmamışsa, Redis yerine memory kullanıldığına dair bir *warning* loglanması sağlandı.

### B. DailyExportRateLimiter (Rate Limiting)
- Eski eşzamanlı (sync) sayaç fonksiyonu `async def consume(...)` formuna taşındı.
- İstek esnasında Redis erişimi var ise atomik işlemler olan `incr()` ve `expire()` özellikleri ile IP ve gün (`YYYY-MM-DD`) bazlı limit sayacı tutulmaya başlandı. TTL, gece yarısı (UTC 00:00) sıfırlanacak şekilde hesaplandı.
- **Güvenli Fallback:** Redis bağlantısında olası bir Timeout, ConnectionRefused yaşandığında API'nin 500 hatasına çökmemesi için otomatik `try-except` bloğuyla *memory-fallback* mantığına dönmesi sağlandı.

### C. JobRegistry (Export Durum Takibi)
- İşlem sırasına alınmış Dublaj Export işleri için kullanılan `JobRegistry` metodları (`create`, `get`, `update`, `complete`, `fail`) *async* hale getirildi.
- Her başarılı veya başarısız güncellemeden sonra `self._save_to_redis(job)` asenkron işleyicisi çalıştırılarak `job:<job_id>` şeklindeki anahtara 24 Saat (86400 TTL) ile Job meta verisinin JSON hali kaydedildi.
- Kullanıcıya polling yanıtı dönerken önce *memory lock* taranıp, eğer değer bulunamazsa (örn: pod restart olmuşsa) Redis üzerinden okuma denenmesi eklendi.

### D. Endpoints ve Testlerin Asenkronizasyonu
- Backend içerisinde `.get()`, `.create()` gibi Job ve limit çağrıları yapan Router (`jobs.py` & `video.py`) fonksiyonlarında gerekli `await` eklemeleri yapıldı.
- Testlerdeki (pytest) memory sıfırlama, job kontrol adımları bozulmasın diye *Pytest* ve *Asyncio* adaptasyonları gerçekleştirildi (`asyncio.run()`). Tüm (23 adet) senaryo test edilip başarıyla (%100) geçti.

## Sonraki Adımlar
- VIP/Proje kayıtları PostgreSQL'de kalıcı olduğu ve geçici durumlar (Rate Limit + Job) Redis'e aktarıldığı için artık API daha modülerdir (Stateless). Bu sayede Railway tarafında instance (Replicas) sayısı 1'in üzerine çıkarıldığında Load Balancer, rate limit uyumsuzluğu yaratmadan çalışabilecektir.
- Gelecek aşamada `cleanup_service.py` modülü cron ile optimize edilebilir.
