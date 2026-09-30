# Sprint 43: Cloudflare R2 / S3 Media Storage Migration Plan + Abstraction

## 🎯 Amaç
DublajLab'in medya dosya sistemini (`/app/media`) kalıcı, ölçeklenebilir ve bağımsız bir Cloudflare R2 veya S3-uyumlu nesne depolama (Object Storage) servisine taşımak için gerekli altyapıyı oluşturmak. Bu sprintte mevcut yerel (local) çalışma düzeni tamamen korunmuş; gelecekteki "Büyük Taşıma (Migration)" işlemi için sadece **S3 Storage Abstraction (Adapter)** mimarisi kodlanmıştır. 

## 🛠️ Yapılan Geliştirmeler

### Backend Storage Mimarisinin Ayrıştırılması
- `backend/services/storage_provider.py` dosyası oluşturuldu.
- `StorageAbstraction` soyut temel sınıfı ile standart kontratlar belirlendi:
  - `upload_file(local_path, remote_path)`
  - `delete_file(remote_path)`
  - `file_exists(remote_path)`
  - `get_public_url(remote_path)`
- **`LocalStorageProvider`**: Sistemin mevcut `/app/media` çalışma düzenini taklit eden mock/no-op provider eklendi.
- **`S3StorageProvider`**: Boto3 kütüphanesi kullanılarak gerçek S3/R2 API entegrasyonu yazıldı. Presigned URL oluşturabilme veya Public Base URL üzerinden doğrudan yayın (Serve) edebilme yeteneği kazandırıldı.

### Çekirdek Akışlara Entegrasyon
1. **Job Service (Export & Upload):** AI ve manuel dublaj işlemleri (FFmpeg export'u tamamlandıktan sonra) `get_storage_provider().upload_file` fonksiyonu üzerinden yeni nesne depolama sistemine dosya göndermeye hazır hale getirildi.
2. **Public Feed & User Library:** Public Dublaj listelemesinde ve kullanıcının özel kütüphanesinde (`/api/public/dubs`, `/api/user/exports`), medya varlığı `provider.file_exists()` ile sorgulanıp, eğer nesne S3/Local'de bulunamazsa güvenli bir şekilde `404 Not Found` (Public) veya `download_url = null` (Library) dönülmesi sağlandı.
3. **Retention & Cleanup:** Temizlik servisi (`cleanup_service.py`) ve proje silme uç noktalarında yerel `.unlink()` metoduna ek olarak `provider.delete_file()` komutu çağırılarak uzak nesne depolamasındaki eşzamanlı silme işlemi (senkronizasyon) kodlandı.
4. **Ops Metrikleri (`AdminOpsPanel`):** `/api/admin/ops/metrics` güncellendi ve panele `storage_provider` (Örn: local, s3, r2), `storage_configured` ve `storage_accessible` durumları güvenli bir formatta (credential'lar olmadan) entegre edildi.

### Yapılandırma ve Bağımlılıklar
- `boto3` kütüphanesi `requirements.txt`'ye eklendi.
- `.env` ve `config.py` içerisine S3 altyapısı için gerekli standart değişkenler (`STORAGE_PROVIDER`, `S3_ENDPOINT_URL`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `S3_PUBLIC_BASE_URL`) eklendi.

## 🧪 Testler ve Sonuçlar
- **Mock Testleri (`test_storage_provider.py`):** Boto3 client mock'lanarak `upload_file`, `file_exists`, `delete_file` metotlarının geçerli config ile çalışıp çalışmadığı; geçersiz config verildiğinde ise (Missing Config) çökmeden güvenli `False/None` döndüğü doğrulandı (100% Pass).
- Yüklü olmayan ortamlar veya lokal testler (`LocalStorageProvider`) başarıyla devam etmektedir.

## 📦 Cloudflare R2 Migration Planı (Sıradaki Aşama)
Gelecekte Cloudflare R2'ye tam geçiş yapmak için aşağıdaki adımlar izlenmelidir:
1. **R2 Dashboard:** Bir bucket oluşturun (örn. `dublajlab-media`).
2. **R2 API Token:** Sadece bu bucket'a okuma/yazma (Object Read/Write) yetkisi olan bir API token oluşturun.
3. **CORS:** Cloudflare R2 bucket ayarlarından uygulamanın frontend domainine (`GET`, `HEAD`) izin veren CORS kurallarını ekleyin.
4. **Public Access:** Bucket'a Cloudflare CDN üzerinden public bir domain (Örn. `media.dublajlab.com`) bağlayın ve bunu `S3_PUBLIC_BASE_URL` olarak atayın.
5. **Railway Env:** Railway projesine `STORAGE_PROVIDER=r2` ile birlikte R2'nin verdiği S3 API `ENDPOINT`, `ACCESS_KEY` ve `SECRET_KEY` değerlerini girip servisi yeniden başlatın.

**Not:** Bu aşamada geçmiş `/app/media` içerisindeki dosyalar kaybolacaktır veya manuel olarak (rclone/aws-cli vb.) yeni R2 bucket içerisine kopyalanması gerekecektir (Büyük Medya Migration Job'u).
