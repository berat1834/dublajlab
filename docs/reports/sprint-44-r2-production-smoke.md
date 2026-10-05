# Sprint 44 — Cloudflare R2 Production Enable + Migration Smoke

## Amaç

Faz 43 storage abstraction katmanını büyük toplu migration yapmadan production
benzeri kullanıma hazırlamak; önce mock/regresyon kontrolleri, ardından ayrı bir R2
staging bucket üzerinde opt-in smoke uygulamak.

## Başlangıç denetimi

- `STORAGE_PROVIDER` varsayılanı `local` olarak korunuyor.
- Çalışma ortamında `S3_ENDPOINT_URL`, access key, secret, bucket ve public base URL
  tanımlı değildi.
- Açık browser/provider oturumu bulunmadığından Cloudflare/Railway dashboard ayarı
  bu çalışmada yapılamadı.
- Faz 43 dosyaları çalışma ağacında mevcut olsa da başlangıçta commit/push edilmemişti;
  bu nedenle gerçek production geçişi ön koşulu sağlanmış kabul edilmedi.
- Hiçbir secret okunmadı, loglanmadı veya repoya yazılmadı.

## Kapatılan teknik riskler

- S3/R2 upload başarısızlığı artık yutulmuyor. Job Türkçe, görünür bir hata ile
  `failed` oluyor ve eksik objeye bağlı sahte `completed` sonucu üretilmiyor.
- Senkron geriye uyumlu export endpoint'leri de aynı upload kontrolünü kullanıyor.
- Local provider artık `file_exists()` için gerçek dosya durumunu kontrol ediyor.
- Kütüphane ve public feed, objenin varlığını doğrulayıp public base URL veya güncel
  presigned URL döndürüyor.
- Yerel metadata volume'dan kaybolsa bile R2 objesi standart `<output_id>.mp4`
  anahtarıyla bulunabiliyor.
- Obje yoksa kütüphane `download_url=null` döndürüyor; public feed kaydı gizliyor.
- Proje silme, local metadata olmasa da uzak objeyi siliyor.
- Retention cleanup, local mirror önceden silinmiş olsa bile süresi dolmuş R2 objesini
  hedefliyor.
- Admin ops storage healthcheck'i gerçek bucket erişimini dener ve yalnız provider adı
  ile boolean durumları döndürür; endpoint/key/secret response'a eklenmez.
- Frontend `absoluteApiUrl()` mutlak R2/CDN URL'lerini bozmadan kullanır; local API
  yolları önceki davranışını korur.
- Object key path traversal girdileri reddedilir.

## Otomatik doğrulama kapsamı

- S3 provider eksik config fail-closed davranışı
- Upload, delete, exists, bucket healthcheck
- Public base URL ve presigned URL üretimi
- Local provider gerçek dosya ve path traversal regresyonu
- Upload başarısız olduğunda failed job ve görünür Türkçe hata
- R2 URL kullanan user library
- Missing object için null library URL ve gizlenen public feed
- Proje silmede uzak obje silme
- Retention cleanup uzak obje silme
- Admin ops response secret sızıntısı kontrolü
- Frontend external/local download URL davranışı

`backend/tests/test_r2_staging_smoke.py` varsayılan olarak skip edilir. Yalnız
`RUN_R2_SMOKE=1` ve staging secret'ları process environment içinde mevcutken küçük
bir `smoke-tests/<uuid>.mp4` nesnesiyle upload → exists → URL → delete akışını çalıştırır.

## Staging smoke durumu

**Bekliyor — credential/bucket yok.** Bu nedenle R2 bucket içinde gerçek export
objesi oluştuğu veya gerçek indirme URL'sinin çalıştığı iddia edilmemektedir.

### Canlı erişim kontrolü

5 Ekim 2026 tarihinde kullanıcı, canonical frontend'in
`https://www.dublajlab.com.tr` üzerinden açıldığını görsel olarak doğruladı. Aynı
oturumda aşağıdaki salt-okunur istekler HTTP 200 döndürdü:

- `https://www.dublajlab.com.tr`
- Railway backend `/api/health`
- Railway backend `/api/system/ffmpeg`
- Railway backend `/api/system/demo-policy`
- Railway backend `/api/templates`

Bu sonuç frontend, Railway backend ve temel FFmpeg servisinin erişilebilir olduğunu
gösterir. `STORAGE_PROVIDER=s3` doğrulaması, bucket'a gerçek obje yazılması veya R2
indirme/silme akışının geçtiği anlamına gelmez.

### Son doğrulama sonuçları

- Backend: 117 test toplandı; 116 geçti, yalnız credential gerektiren opt-in R2
  staging testi beklendiği gibi skip edildi.
- Frontend: ESLint geçti; Vitest 4 dosyada 9/9 geçti; TypeScript/Vite production
  build geçti.
- Docker Compose config geçti. Redis servisi `services` altında doğrulandı ve R2
  environment değişkenleri backend container'a aktarılıyor.
- `git diff --check` geçti.
- `npm audit --omit=dev`: 0 vulnerability.
- Tam `npm audit`, Tailwind 3 build zincirindeki `braces` duyurusu nedeniyle 5 high
  dev-only bulgu raporluyor. npm'in önerdiği tek otomatik çözüm Tailwind 4'e kırıcı
  major yükseltme olduğundan bu storage sprintinde uygulanmadı; deploy edilen statik
  frontend runtime paketlerinde bulgu yok.

Staging değerleri Railway/yerel process environment'a girildiğinde sıralama:

1. Opt-in R2 provider smoke testini çalıştır.
2. Küçük, telifsiz test videosu yükle ve iki replikle export al.
3. `<output_id>.mp4` objesini staging bucket içinde doğrula.
4. Kütüphane indirme bağlantısını aç.
5. Projeyi public yap ve feed'de görünürlüğü doğrula.
6. Test objesini bucket'tan sil; library URL'nin null ve feed kaydının gizli olduğunu doğrula.
7. Yeni bir test export'u üretip projeyi uygulamadan sil; objenin de silindiğini doğrula.
8. Süresi dolmuş test export'u için maintenance cleanup çalıştır ve objenin silindiğini doğrula.
9. `STORAGE_PROVIDER=local` rollback'i sonrası volume tabanlı export'u doğrula.

## Güvenlik kararı

- İlk denemede production bucket yerine ayrı staging bucket zorunludur.
- Token yalnız ilgili bucket için Object Read/Write kapsamına sahip olmalıdır.
- Private bucket + presigned URL ilk tercih olarak belgelenmiştir.
- Gerçek credential'lar yalnız provider dashboard environment variables içinde tutulur.
- Büyük geçmiş medya migration'ı bu sprintin kapsamı dışındadır.
