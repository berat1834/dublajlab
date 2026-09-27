# Sprint 30: Serverless GPU (Modal.com) Entegrasyon Taslağı

## Amaç ve Kapsam
Meme Dublaj Studio'nun dudak senkronizasyonu (Wav2Lip) gibi ağır yapay zeka çıkarım (inference) işlemlerini ana FastAPI sunucusundan (CPU üzerinden) ayırıp, Serverless GPU hizmetlerine (örneğin Modal.com gibi mikroservislere) dağıtma mimarisi kurgulanmıştır.

Bu sprintte gerçek bir deployment yapılmamış olup, webhook/serverless yapısına geçiş yapabilmek için kod tabanı esnek hale getirilmiş ve Modal ortamı için temel kod taslağı hazırlanmıştır.

## Mimari Karar: Neden Serverless GPU?
Ağır GPU yükünün FastAPI sunucusundan Modal.com serverless ortamına dağıtılması şu avantajları sağlar:
1. **Maliyet Optimizasyonu**: Sunucuda sürekli bir GPU (örn. T4, A10G) barındırmak pahalıdır. Serverless mimarisi sayesinde sadece video işlendiği milisaniye/saniye başına GPU ücreti ödenir (Scale to zero).
2. **Performans (Darboğazın Önlenmesi)**: Ana API sunucumuz (Railway/FastAPI) web isteklerini (Kullanıcı kaydı, auth, video indirme vb.) karşılarken, dudak senkronizasyonu aynı CPU/Memory bloğunu işgal edip diğer kullanıcıların HTTP isteklerini bloke etmez.
3. **Ölçeklenebilirlik**: Aynı anda 10 kullanıcı Wav2Lip işlemi başlatırsa, Serverless GPU altyapısı (örn. Modal) 10 ayrı kapsayıcı (container) ayağa kaldırıp işlemleri paralel yapar, oysa yerel makine sıraya sokmak (kuyruk) zorundadır.

## Yapılan Geliştirmeler

### 1. Konfigürasyon Yapılandırması (Environment)
- `backend/config.py` ve `.env.example` dosyalarına `LIPSYNC_MODE` ("local" veya "serverless") ve `LIPSYNC_WEBHOOK_URL` değişkenleri eklendi.
- Gizlilik ve güvenlik disiplinine sadık kalınarak hiçbir gerçek token/secret repo'ya dahil edilmedi.

### 2. Mikroservis Taslağı (Modal.com)
- Proje dizinine `serverless/` klasörü açıldı.
- İçerisine `modal_lipsync.py` yazılarak, FastAPI Request'ini alan, Debian + GPU image'i üzerine Wav2Lip bağımlılıklarını ve FFmpeg'i kuran taslak bir Modal endpoint (webhook) tanımlandı.

### 3. Servis Katmanı Esnekliği (`lip_sync_service.py`)
- Mevcut yerel `subprocess` mimarisi bozulmadan korundu (`LIPSYNC_MODE == "local"`).
- `LIPSYNC_MODE == "serverless"` olduğunda, `httpx` ile asenkron webhook isteği (POST) atan yeni bir blok eklendi.
- Ağ hatası veya bağlantı kopması durumunda UI'da gösterilmek üzere Türkçe *"Uzak GPU sunucusuna ulaşılamadı, işlem iptal edildi."* hatası fırlatıldı.

## Test ve Doğrulama
- Backend için yazılan `test_lip_sync.py` test suite'ine serverless mock senaryoları eklendi.
- Pytest ile `httpx.AsyncClient` bağlantıları mock'lanarak (başarılı ve hata senaryoları) birim testleri sıfır hata ile tamamlandı.
- Frontend testleri (eslint) başarılı.
