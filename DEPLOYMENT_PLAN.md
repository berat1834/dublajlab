# DublajLab Deployment Planı

> Tarih: 25 Eylül 2026  
> Kapsam: Canlı public demo için mimari ve platform kararı  
> Durum: Yalnızca planlama; bu belge herhangi bir deployment veya kod değişikliği yapmaz.

## 1. Karar özeti

İlk canlı demo için önerilen mimari:

```text
Kullanıcı
   │
   ├── HTTPS → dublajlab.example
   │              └── Vercel: React/Vite statik frontend
   │
   └── HTTPS → api.dublajlab.example
                  └── Railway: tek replik FastAPI Docker servisi
                                ├── FFmpeg / FFprobe
                                ├── memory job registry
                                └── /app/media Railway volume
```

- **Frontend:** Vercel Hobby, statik Vite deployment
- **Backend:** Railway Hobby, mevcut `backend/Dockerfile` ile tek servis ve tek replik
- **Medya:** Railway volume, `/app/media` mount noktası
- **Cleanup:** Saatlik Railway cron isteği → token korumalı maintenance endpoint'i
- **Tahmini başlangıç maliyeti:** Düşük trafikte yaklaşık **5–15 USD/ay**, domain hariç
- **Ölçek sınırı:** Bu mimari public demo içindir; gerçek production ve çoklu instance için memory job/rate-limit servisleri Redis veya kalıcı queue'ya taşınmalıdır.

Bu seçim, en ucuz teorik çözüm olduğu için değil; Docker/FFmpeg desteği, yönetim kolaylığı, volume, GitHub bağlantısı ve öğrenci portföyü açısından dengeli olduğu için önerilir.

## 2. Projenin deployment gereksinimleri

DublajLab sıradan bir statik web sitesi değildir. Platform seçimini belirleyen gereksinimler:

- FFmpeg ve FFprobe içeren Linux container
- 20–50 MB arası video upload
- CPU ağırlıklı MP4 export
- Upload, kayıt ve output için yazılabilir disk
- Aynı process içinde yaşayan memory tabanlı job registry
- Frontend'den backend'e job polling
- Token korumalı medya cleanup endpoint'i
- Public demo dosya, süre ve günlük export limitleri
- Güvenilir CORS ve reverse proxy/IP yapılandırması

Backend, küçük serverless fonksiyonlara taşınmamalıdır. Frontend statik olarak ayrı yayınlanabilir; video upload tarayıcıdan doğrudan backend domain'ine gitmelidir.

## 3. Platform karşılaştırması

Fiyatlar 25 Eylül 2026 tarihinde erişilen resmî fiyatlara göre yaklaşık değerlerdir. Vergi, domain, yedekleme ve yüksek egress kullanımı dahil değildir.

| Seçenek | FFmpeg + Docker | Kalıcı volume | Uyku etkisi | Upload uygunluğu | Cleanup | Karmaşıklık | Yaklaşık maliyet | Karar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Render | Var | Yalnızca ücretli serviste; tek instance | Free servis 15 dk boşta uyur, yerel dosyalar silinir | 20 MB demo limiti ayrıca smoke test edilmeli | Cron HTTP endpoint'i çağırabilir | Düşük | 7 USD + disk; FFmpeg için gerçekçi 2 GB plan 25 USD + disk | Kolay fakat yeterli RAM ile pahalı |
| Railway | Var; özel Dockerfile yolu desteklenir | Hobby volume; volume varken tek replik | Serverless isteğe bağlı; ilk demoda kapalı | Tarayıcı doğrudan API'ye yükler | Cron ile tokenlı HTTP çağrısı | Düşük–orta | Minimum 5 USD; düşük trafikte 5–15 USD | **Önerilen backend** |
| Fly.io | Var | Machine/bölgeye bağlı Fly Volume | Autostop var; memory job için risk | Uygulama limitiyle yönetilebilir | Machine/cron yaklaşımı | Orta–yüksek | 1 GB 5.92 USD, 2 GB 11.11 USD + volume | Güçlü ama ilk deploy için karmaşık |
| VPS | Tam kontrol | Yerel NVMe | Uyku yok | Reverse proxy ve uygulama kontrolünde | Linux cron kolay | Yüksek operasyon | Örnek CX23 6.49 USD; eklerle 8–12 USD | Ucuz ve güçlü, bakım yükü yüksek |
| Vercel frontend + ayrı backend | Frontend için iyi; Function backend uygun değil | Function filesystem kalıcı değil | Statik frontend uyumaz | Function payload sınırı 4.5 MB; doğrudan backend şart | Backend tarafında | Düşük | Kişisel Hobby frontend 0 USD + backend | **Önerilen birleşik mimari** |

### 3.1 Render

**Artıları**

- Dockerfile'dan web service build edebilir.
- Static site, custom domain ve yönetilen TLS kullanımı kolaydır.
- Ücretli servise persistent disk eklenebilir.
- Dashboard deneyimi yeni başlayanlar için sadedir.

**Eksileri**

- Free web service 15 dakika trafik almayınca kapanır; yeniden açılması yaklaşık bir dakika sürebilir.
- Free servisin filesystem'i ephemeral'dır ve persistent disk bağlanamaz.
- 7 USD'lik başlangıç compute'u 512 MB RAM sağlar; FFmpeg yükünde OOM riski vardır.
- 2 GB RAM/1 CPU seviyesi 25 USD/ay olduğundan öğrenci demosu için pahalı kalabilir.
- Persistent disk tek instance'a bağlıdır ve yatay ölçeklemeyi engeller.
- Render cron job diske erişemez; cleanup backend endpoint'ini HTTP üzerinden çağırmalıdır.

Resmî kaynaklar: [free servis sınırları](https://render.com/docs/free), [fiyatlar](https://render.com/pricing), [persistent disk](https://render.com/docs/disks), [Docker](https://render.com/docs/docker), [cron jobs](https://render.com/docs/cronjobs).

### 3.2 Railway

**Artıları**

- Monorepo içinde `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile` kullanılabilir.
- Hobby planı 5 USD/aydır ve ilk 5 USD kaynak kullanımı bu tutara dahildir.
- Kalıcı volume mount edilebilir; Hobby volume üst sınırı varsayılan olarak 5 GB'dır.
- Custom domain ve otomatik TLS desteği vardır.
- Cron işleri UTC zamanlamayla çalıştırılabilir.
- Kullanıma dayalı faturalama düşük trafikli portföy demosuna uygundur.

**Eksileri**

- RAM, CPU, egress ve volume kullanımı arttığında fatura 5 USD'yi aşabilir.
- Volume bağlı servis replica kullanamaz ve deployment sırasında kısa kesinti yaşayabilir.
- Serverless modu memory job registry için risklidir; ilk demo sırasında kapatılmalıdır.
- Gerçek istemci IP header'ı doğrulanmadan `TRUST_PROXY_HEADERS=true` yapılmamalıdır.

Railway resmî fiyatları RAM için 10 USD/GB-ay, CPU için 20 USD/vCPU-ay, egress için 0.05 USD/GB ve volume için 0.15 USD/GB-ay olarak listeler. Gerçek maliyet ilk hafta ölçülmelidir.

Resmî kaynaklar: [planlar](https://docs.railway.com/pricing/plans), [kaynak fiyatları](https://docs.railway.com/pricing), [volumes](https://docs.railway.com/volumes/reference), [Dockerfiles](https://docs.railway.com/builds/dockerfiles), [serverless](https://docs.railway.com/deployments/serverless), [custom domains](https://docs.railway.com/networking/domains/working-with-domains).

### 3.3 Fly.io

**Artıları**

- Docker container, FFmpeg ve uzun yaşayan FastAPI servisi için uygundur.
- Volume ve bölge seçimi sunar.
- Autostop/autostart ile boşta compute maliyeti azaltılabilir.

**Eksileri**

- Free trial yalnızca 2 toplam VM saati veya 7 günle sınırlıdır; kalıcı ücretsiz hosting değildir.
- Volume belirli Machine/bölgeye bağlıdır.
- Autostop aktif background export ve memory job registry için dikkat gerektirir.
- CLI, `fly.toml`, Machine ve volume kavramları ilk deployment'ı daha karmaşık yapar.

Paylaşımlı 1 CPU/1 GB Machine yaklaşık 5.92 USD/ay, 2 GB sürümü 11.11 USD/aydır. Volume 0.15 USD/GB-ay; Avrupa/Kuzey Amerika egress'i 0.02 USD/GB seviyesindedir.

Resmî kaynaklar: [fiyatlar](https://fly.io/docs/about/pricing/), [free trial](https://fly.io/docs/about/free-trial/), [autostop/autostart](https://fly.io/docs/reference/fly-proxy-autostop-autostart/).

### 3.4 VPS

**Artıları**

- Mevcut Docker Compose yapısı az uyarlamayla çalışabilir.
- Docker, FFmpeg, reverse proxy, volume ve cron üzerinde tam kontrol sağlar.
- Sabit maliyetle daha fazla RAM ve CPU alınabilir.

**Eksileri**

- OS güncellemesi, firewall, SSH, TLS, log rotation, disk takibi, backup ve incident müdahalesi proje sahibine aittir.
- Hatalı reverse proxy veya port ayarı backend'i gereğinden fazla açabilir.
- Tek VPS tek hata noktasıdır.

Hetzner'ın Haziran 2026 sonrası CX23 planı 2 paylaşımlı vCPU, 4 GB RAM ve 40 GB NVMe için yaklaşık 6.49 USD/ay olarak listelenmektedir; vergi ve IPv4 hariçtir. Eklerle 8–12 USD/ay bütçe ayrılmalıdır.

Resmî kaynaklar: [Hetzner cost-optimized cloud](https://www.hetzner.com/cloud/cost-optimized/), [2026 fiyat güncellemesi](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/).

### 3.5 Vercel frontend + ayrı backend

**Artıları**

- Vite `dist` çıktısı için CDN, preview deploy ve otomatik TLS sunar.
- Kişisel/portföy amaçlı Hobby planı ücretsizdir.
- Frontend deploy'u CPU yoğun backend'den ayrılır.

**Eksileri**

- İki provider ve iki domain CORS yönetimi gerektirir.
- `VITE_API_BASE_URL` build-time değişkenidir; API domain'i değişirse frontend yeniden build edilir.
- Vercel Functions payload limiti 4.5 MB'dır. Video/ses Vercel Function veya rewrite proxy'sinden geçirilmemeli, doğrudan Railway API'ye gitmelidir.
- Hobby plan kişisel ve ticari olmayan kullanım içindir.

Resmî kaynaklar: [Hobby planı](https://vercel.com/docs/plans/hobby), [Function limitleri](https://vercel.com/docs/functions/limitations), [custom domain](https://vercel.com/docs/domains/set-up-custom-domain).

## 4. Önerilen hedef mimari

### 4.1 Frontend

Vercel üzerinde ayrı proje:

- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: `VITE_API_BASE_URL=https://api-domain.railway.app`
- Upload ve polling doğrudan API domain'ine gider.
- Vercel Function/API proxy eklenmez.

`dublajlab.vercel.app` ve `api-domain.railway.app` bu plandaki güvenli örnek domain'lerdir; provider'ın projeye verdiği gerçek domain'lerle değiştirilmelidir.

### 4.2 Backend

Railway üzerinde tek Docker service:

- GitHub repository bağlanır.
- Build context repository root olarak kalır.
- Dockerfile yolu `backend/Dockerfile` olur.
- Tek replik ve tek Uvicorn worker korunur.
- İlk public demo sırasında Railway Serverless kapalı tutulur.
- Healthcheck `GET /api/health` olur.
- Önce Railway geçici domain'i, sonra `api.dublajlab.example` doğrulanır.

Memory job registry nedeniyle ikinci replica açılmamalıdır. Aksi halde export'u oluşturan instance ile job'u sorgulayan instance farklı olabilir.

### 4.3 Media volume

- Railway volume `/app/media` olarak mount edilir.
- `MEDIA_ROOT=/app/media` ayarlanır.
- `uploads`, `outputs`, `recordings`, `audio`, `subtitles`, `tmp` ve `metadata` burada kalır.
- Volume kalıcı kullanıcı arşivi değil, geçici çalışma alanıdır.
- Başlangıçta 5 GB yeterlidir; %70 dolulukta cleanup/quota kontrolü yapılır.
- Hassas medya gereksiz süre snapshot veya backup içinde tutulmaz.

Mount yolu mevcut runtime yapısıyla doğrulanmıştır:

- `backend/Dockerfile`, `MEDIA_ROOT=/app/media` tanımlar, `/app/media` klasörünü oluşturur ve aynı yolu `VOLUME` olarak işaretler.
- `docker-compose.yml`, `dublajlab_media:/app/media` mount'unu kullanır.
- Railway dashboard'da volume mount path kesin olarak `/app/media` girilmelidir; `/app`, `/media` veya repository içindeki `backend/data` kullanılmamalıdır.
- Deploy sonrasında `/api/health` kontrolüne ek olarak upload → restart → metadata erişimi smoke testiyle volume kalıcılığı doğrulanmalıdır.

### 4.4 Environment değişkenleri

#### Railway backend

| Değişken | Production örneği | Zorunlu | Açıklama |
| --- | --- | --- | --- |
| `APP_ENV` | `production` | Evet | Production maintenance güvenliğini etkinleştirir |
| `MEDIA_ROOT` | `/app/media` | Evet | Railway volume mount noktasıyla birebir aynı olmalı |
| `ALLOWED_ORIGINS` | `https://dublajlab.vercel.app` | Evet | Tarayıcının geldiği frontend origin'i; API adresi değildir |
| `MAINTENANCE_TOKEN` | `<RAILWAY_SECRET_PLACEHOLDER>` | Evet | Railway secret olarak üretilir; repoya veya frontend'e yazılmaz |
| `PUBLIC_DEMO_MODE` | `true` | Evet | Public demo limitlerini açar |
| `DEMO_MAX_FILE_SIZE_MB` | `20` | Evet | Video upload üst sınırı |
| `DEMO_MAX_VIDEO_DURATION_SECONDS` | `30` | Evet | CPU ve export süresi sınırı |
| `DEMO_MAX_RECORDING_SIZE_MB` | `5` | Evet | Replik başına kayıt üst sınırı |
| `DEMO_MAX_EXPORTS_PER_IP_PER_DAY` | `5` | Evet | UTC gününde IP başına export kotası |
| `DEMO_MEDIA_TTL_HOURS` | `6` | Evet | Cleanup için önerilen geçici medya ömrü |
| `TRUST_PROXY_HEADERS` | `false` | Evet | Railway proxy header davranışı doğrulanana kadar açılmaz |

Railway build/deploy ayarları environment secret değildir ancak servis ayarlarında ayrıca doğrulanmalıdır:

| Ayar | Değer |
| --- | --- |
| Dockerfile path | `backend/Dockerfile` |
| Build context | Repository root |
| Volume mount path | `/app/media` |
| Replica | `1` |
| Serverless/App Sleeping | İlk public demoda kapalı |
| Healthcheck path | `/api/health` |

FFmpeg ve FFprobe image PATH'inde bulunduğundan özel binary yolu gerekmedikçe tanımlanmaz.

#### Vercel frontend

| Değişken | Production örneği | Ortam | Açıklama |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | `https://api-domain.railway.app` | Production | Frontend'in doğrudan çağıracağı Railway HTTPS origin'i |
| `VITE_API_BASE_URL` | `https://api-domain.railway.app` | Preview | Preview deploy'larının aynı public demo backend'ini kullanması isteniyorsa ayrıca tanımlanır |

Backend secret'ları frontend environment'ına eklenmez.

`VITE_` önekli değerler Vite build sırasında tarayıcı bundle'ına yazılır ve kullanıcı tarafından görülebilir. Bu nedenle `VITE_API_BASE_URL` yalnızca public API origin'i içermelidir; token, parola veya maintenance secret içermemelidir. Değer değiştirildiğinde mevcut deployment runtime'da kendiliğinden güncellenmez, frontend yeniden build/deploy edilmelidir.

Production CORS/API eşleşmesi:

```dotenv
# Railway backend
ALLOWED_ORIGINS=https://dublajlab.vercel.app

# Vercel frontend
VITE_API_BASE_URL=https://api-domain.railway.app
```

`ALLOWED_ORIGINS` içine `https://api-domain.railway.app` yazılmaz; CORS origin, API'yi çağıran frontend adresidir. Birden fazla izinli frontend gerekiyorsa backend'in desteklediği biçimde virgülle ayrılır ve wildcard kullanılmaz.

### 4.5 Domain ve TLS

```text
dublajlab.example       → Vercel frontend
www.dublajlab.example   → ana domaine redirect
api.dublajlab.example   → Railway backend
```

1. Frontend domain'i Vercel'e eklenir ve gösterilen A/CNAME kayıtları girilir.
2. Railway'e `api` domain'i eklenir; verilen CNAME ve sahiplik TXT kaydı girilir.
3. İki sağlayıcının yönetilen TLS sertifikası doğrulanır.
4. `ALLOWED_ORIGINS` gerçek frontend origin'iyle güncellenir.
5. `VITE_API_BASE_URL` gerçek API origin'iyle yeniden build edilir.

### 4.6 Cleanup

Önerilen ilk politika:

- TTL: 6 saat
- Sıklık: Her saat
- Endpoint: `POST /api/maintenance/cleanup?older_than_hours=6`
- Header: `X-Maintenance-Token: <provider-secret>`
- Scheduler: Railway cron service veya güvenilir harici cron

Cron backend volume'una bağlanmaz; yalnızca HTTPS maintenance endpoint'ini çağırır. Dosyaları backend process'i kendi volume'undan siler.

Manuel veya scheduler smoke testi için placeholder kullanan `curl` örneği:

```bash
curl --fail-with-body --request POST \
  --header "X-Maintenance-Token: <MAINTENANCE_TOKEN_PLACEHOLDER>" \
  "https://api-domain.railway.app/api/maintenance/cleanup?older_than_hours=6"
```

Gerçek token shell geçmişine yazılmamalıdır. Otomasyonda token provider secret'ından okunmalı; loglara header veya token değeri basılmamalıdır.

- Cleanup sonucu loglarda izlenir.
- Volume %70 dolulukta manuel cleanup yapılır.
- Volume %85 dolulukta demo geçici kapatılır veya limitler düşürülür.
- Token URL'ye değil yalnızca header'a yazılır.

## 5. Public demo güvenliği

- `PUBLIC_DEMO_MODE=true`
- Upload 20 MB, video 30 saniye, kayıt 5 MB
- Günlük IP export kotası en fazla 5
- CORS yalnızca gerçek frontend origin'ine açık
- Maintenance endpoint'i güçlü token ile korumalı
- Harcama bildirimi/bütçe alarmı etkin
- Backend replica sayısı 1
- Serverless sleep ilk demo sırasında kapalı
- Upload Vercel Function üzerinden proxy edilmiyor
- İlk hafta CPU, RAM, volume, egress, 413/429 ve FFmpeg logları günlük inceleniyor

## 6. Riskler ve azaltma planı

| Risk | Etki | İlk aşama azaltma | Kalıcı çözüm |
| --- | --- | --- | --- |
| Backend restartında job registry silinir | Polling 404, durum kaybı | Tek instance, sleep kapalı, kısa videolar | Redis/RQ/Celery ve kalıcı job store |
| Memory rate limit restartta sıfırlanır | Kota aşılabilir | Harcama alarmı ve düşük limitler | Redis tabanlı limiter |
| Birden fazla FFmpeg işi başlar | CPU/RAM tükenir | Kısa video, düşük kota, sınırlı demo paylaşımı | Concurrency=1 worker queue |
| Volume dolar | Upload/export başarısız | 6 saat TTL, saatlik cleanup | Object storage lifecycle |
| Proxy IP güveni yanlış | Tek IP veya spoof | Başlangıçta `TRUST_PROXY_HEADERS=false` | Güvenilir proxy middleware |
| CORS yanlış | Frontend API'ye erişemez | Kesin HTTPS origin ve smoke test | Environment doğrulaması |
| FFmpeg faturayı artırır | Beklenmeyen maliyet | 30 sn/20 MB sınırı, alarm | Queue ve CPU kotası |
| Volume bağlı deploy kesintisi | Kısa downtime | Demo dışı saatte deploy | Kalıcı queue/worker |
| Telifli veya özel upload | Hukuki/gizlilik riski | Uyarı, kısa TTL, paylaşmama | Moderasyon ve kullanım şartları |

## 7. İlk deployment adımları

### A. Yayın öncesi

1. `feat/public-demo-safety` PR üzerinden `main` branch'ine alınır.
2. Lokal Docker build ve healthcheck yeniden çalıştırılır.
3. Proje sahibine ait 10–20 saniyelik videoyla upload → iki kayıt → export → download smoke testi yapılır.
4. Secret'ların yalnızca provider dashboard'da tutulacağı doğrulanır.

### B. Railway backend

5. Railway Hobby project oluşturulur ve repository bağlanır.
6. Dockerfile yolu `backend/Dockerfile`, build context repository root seçilir.
7. Backend environment değişkenleri dashboard'a girilir.
8. `/app/media` volume bağlanır.
9. Tek replica, Serverless kapalı olacak şekilde deploy edilir.
10. `/api/health`, `/api/system/demo-policy` ve `/api/templates` kontrol edilir.
11. Container içinde FFmpeg/FFprobe sağlık durumu doğrulanır.

### C. Vercel frontend

12. Repository Vercel'e bağlanır.
13. Root `frontend`, build `npm run build`, output `dist` seçilir.
14. `VITE_API_BASE_URL` önce Railway geçici HTTPS domain'i yapılır.
15. Browser Network panelinde upload/polling'in doğrudan Railway'e gittiği doğrulanır.

### D. Domain ve güvenlik

16. Ana domain Vercel'e, `api` subdomain'i Railway'e bağlanır.
17. TLS sonrası CORS ve API URL gerçek domainlerle güncellenir.
18. 413, 429 ve yanlış maintenance token için 403 smoke testleri yapılır.
19. Proxy header doğrulanmadan `TRUST_PROXY_HEADERS` açılmaz.

### E. Cleanup ve gözlem

20. Saatlik cleanup cron isteği tanımlanır.
21. Cleanup önce kontrollü test dosyalarıyla doğrulanır, sonra 6 saat TTL kullanılır.
22. Railway usage/bütçe bildirimi etkinleştirilir.
23. Bir hafta sonra CPU, RAM, egress ve volume kullanımıyla maliyet tahmini güncellenir.

## 8. Kabul kriterleri

- [ ] Frontend ve API custom domain'leri HTTPS ile açılıyor.
- [ ] CORS yalnızca beklenen origin'e izin veriyor.
- [ ] `/api/health` başarılı ve FFmpeg hazır.
- [ ] Demo policy doğru limitleri gösteriyor.
- [ ] Güvenli test videosu yükleniyor.
- [ ] İki mikrofon kaydı backend'e gidiyor.
- [ ] Job `queued → processing → completed` durumlarından geçiyor.
- [ ] Sonuç MP4 oynuyor ve indiriliyor.
- [ ] 413, 429 ve 403 durumları doğru mesajları veriyor.
- [ ] Cleanup eski medyayı siliyor.
- [ ] Volume restart sonrasında erişilebilir.
- [ ] Harcama alarmı ve log erişimi hazır.

## 9. Ne zaman VPS'e geçilmeli?

- Railway maliyeti düzenli olarak 15–20 USD'yi aşarsa
- FFmpeg için sürekli 2–4 GB RAM gerekirse
- Özel worker/concurrency kontrolü kurulacaksa
- Linux, reverse proxy ve monitoring öğrenmek yeni hedefse
- Sabit maliyet ve daha geniş disk öncelik kazanırsa

VPS'e geçmeden önce Redis job queue, concurrency sınırı, merkezi log, backup ve güvenli reverse proxy planı tamamlanmalıdır.

## 10. Son karar

**İlk public demo: Vercel frontend + Railway backend + Railway volume.**

Bu mimari mevcut tek-process job yapısına, Dockerfile'a ve public demo limitlerine en az müdahaleyle uyar. İlk hafta gerçek kullanım ölçülür. Demo ilgi görür veya maliyet artarsa ilk teknik adım VPS'e taşınmak değil, kalıcı queue ve concurrency kontrolünü eklemek olmalıdır.
