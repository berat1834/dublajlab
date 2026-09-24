# DublajLab Profesyonel Urunlestirme Promptu

Bu dosyayi VS Code Codex, Cursor, Claude Code veya Antigravity icinde mevcut `dublajlab` reposunun kok dizininde ac ve asagidaki talimatlari uygula.

## Hedef

Mevcut DublajLab MVP'sini dublaj.io / memedublaj benzeri, yayina alinabilecek, portfoyde guclu duracak ve gercek kullanicilarla test edilebilecek profesyonel bir web uygulamasina donustur.

Uygulamanin ana farki:

- Kullanici hazir veya kendi yukledigi kisa videoyu izler.
- Videodaki replik/timeline satirlarini gorur.
- Her satiri kendi sesiyle kaydeder.
- Sistem kayitlari dogru zamanlara yerlestirir.
- Altyazi, orijinal ses ve dublaj sesi ayarlariyla MP4 export verir.
- Opsiyonel olarak AI ses modu vardir, ama ana deneyim kullanicinin kendi sesiyle dublaj yapmasidir.

Bu proje oncelikle portfoy, CV, GitHub ve LinkedIn icindir. Para kazanma ikinci plandadir. Bu yuzden teknik kalite, demo deneyimi, guvenlik, README, testler ve yayina hazirlik onemlidir.

## Urun Prensipleri

1. Telifli video veya gercek kisi taklidi uretme varsayimi yapma.
2. Kullaniciya kendi videosunu yuklet veya acik lisansli demo video kullandir.
3. AI voice clone yapma. Gercek kisilerin sesini taklit etme ozelligi ekleme.
4. Ana deger: "Kendi sesinle replik replik dublaj yap".
5. MVP'yi bozmadan asamali gelistir.
6. Her faz sonunda backend testleri, frontend lint/build ve temel smoke test gecmeli.

## Mevcut Durum Varsayimi

Repo su yapida:

- `backend/`: FastAPI, FFmpeg, upload/process/download endpointleri
- `frontend/`: React + TypeScript + Vite + Tailwind
- `backend/services/ffmpeg_service.py`: FFmpeg komutlari
- `backend/routers/video.py`: upload, process, preview, download akislari
- `frontend/src/App.tsx`: ana UI
- `frontend/src/components/TimelineRecorder.tsx`: replik ve mikrofon kayit akisi
- `README.md`: kurulum ve proje aciklamasi

Mevcut sistemi incelemeden kod yazma. Once dosyalari oku, mevcut patternleri koru.

## Faz 1: Production Hardening

Once uygulamayi daha guvenli ve daha dayanikli hale getir.

### Yapilacaklar

1. FFmpeg timeout ekle
   - `FFmpegService._run()` icin timeout parametresi ekle.
   - Varsayilan process timeout: 180 saniye.
   - FFprobe icin daha kisa timeout: 30 saniye.
   - Timeout olursa Turkce, kullanici dostu hata dondur.

2. Maintenance endpoint korumasi
   - `/api/maintenance/cleanup` public kalmasin.
   - `.env` icinden `MAINTENANCE_TOKEN` oku.
   - Token yoksa local/dev disinda endpoint calismasin.
   - Token varsa `X-Maintenance-Token` header'i ile dogrula.
   - README'ye ekle.

3. Dosya temizleme iyilestirmesi
   - Basarili export sonrasi gecici subtitle/audio/recording dosyalari silinmeye devam etsin.
   - Upload/output dosyalari icin otomatik TTL temizleme servisi veya dokumante cron akisi ekle.
   - Kullaniciya "dosyalar kalici saklanmaz" mesaji net olsun.

4. Upload dogrulama
   - Uzanti kontrolu kalsin.
   - FFprobe dogrulamasi zaten varsa koru.
   - Content-Type/magic-byte kontrolu eklemek mumkunse ekle; degilse README'de limit olarak belirt.

5. Testleri guncelle
   - Timeout path'i icin unit test ekle.
   - Maintenance token icin test ekle.
   - Mevcut testleri bozma.

### Acceptance Criteria

- `pytest backend/tests -q` gecmeli.
- `npm run lint` gecmeli.
- `npm run build` gecmeli.
- FFmpeg yoksa sistem Turkce hata donmeli ve frontend cokmemeli.
- Cleanup endpoint token olmadan production'da calismamali.

## Faz 2: Profesyonel Kullanici Deneyimi

Uygulama ilk acildiginda bir urun gibi hissettirmeli.

### Yapilacaklar

1. Ana ekran akisini netlestir
   - Sol taraf: video yukleme/onizleme
   - Sag taraf: replik listesi ve kayit
   - Alt taraf: export sonucu
   - Mobilde tek kolon akisi

2. Demo modu ekle
   - `demo/` icinde telifsiz/kendi uretilmis demo video yoksa README'de nasil eklenecegini anlat.
   - Frontend'de "Demo ile dene" butonu icin altyapi hazirla.
   - Telifli video repoya ekleme.

3. Timeline UX
   - Replik satirlari suruklenebilir olmasa bile daha profesyonel gorunsun.
   - Her replikte:
     - baslangic
     - bitis
     - sure
     - metin
     - kayit durumu
     - dinle / yeniden kaydet / sil
   - Kayit sirasinda aktif satir belirgin olsun.

4. Export UX
   - Gercek progress yoksa "tahmini islem adimi" oldugu belli olsun.
   - Hata durumunda tekrar dene butonu ekle.
   - Basarili export sonrasi:
     - onizleme player
     - MP4 indir
     - yeni video ile basla

5. Etik ve telif uyarisi
   - Kisa, rahatsiz etmeyen ama net bir uyari paneli olsun.
   - "Gercek kisileri taklit etme, telifli icerigi izinsiz dagitma" mesaji korunsun.

### Acceptance Criteria

- Desktop ve mobilde layout kirilmamali.
- Kullanici ilk bakista ne yapacagini anlamali.
- Butonlar disabled/loading/error durumlarina sahip olmali.
- Mikrofon izni reddedilirse anlasilir hata verilmeli.

## Faz 3: Hazir Video ve Sablon Sistemi

dublaj.io / memedublaj benzeri his icin sadece "video yukle" yetmez. Kullanici hazir bir sahne secip dublaj yapabilmeli.

### Backend

1. Demo/template video modeli ekle
   - Basit JSON veya dosya tabanli basla.
   - Alanlar:
     - id
     - title
     - category
     - video_url veya local static path
     - duration_seconds
     - lines: id, start, end, text
     - license/source

2. Endpointler
   - `GET /api/templates`
   - `GET /api/templates/{template_id}`
   - Secilen template'i process akisina kaynak olarak kullanabilme.

3. Telif guvenligi
   - Repoya telifli video koyma.
   - Demo icin kendi cekilmis veya acik lisansli video kullan.
   - Template metadata icinde kaynak/lisans alani zorunlu olsun.

### Frontend

1. "Hazir sahneler" sekmesi ekle
   - Kategori filtreleri:
     - Komik
     - Tepki
     - Drama
     - Oyun
     - Bos template
   - Template kartlari:
     - baslik
     - sure
     - replik sayisi
     - "Dublaj yap" butonu

2. Template secilince:
   - Video preview yuklensin.
   - Timeline otomatik gelsin.
   - Kullanici isterse replik metnini degistirebilsin.

### Acceptance Criteria

- Kullanici hic video yuklemeden demo/template ile akisi deneyebilmeli.
- Template metadata test edilmeli.
- README'de telif politikasina aciklama eklenmeli.

## Faz 4: Job Queue ve Gercek Progress

Profesyonel yayinda video isleme API istegi icinde uzun sure beklememeli.

### Baslangic Icin Basit Cozum

Redis/Celery sart degil. Once dosya tabanli veya memory job registry ile basla. Ancak kodu ileride Celery/RQ'ya gececek sekilde ayir.

### Endpointler

- `POST /api/jobs/dubbing`
  - process baslatir
  - `job_id` doner
- `GET /api/jobs/{job_id}`
  - status: queued | processing | completed | failed
  - progress: 0-100
  - message
  - download_url
- `GET /api/video/download/{output_id}`
  - mevcut download mantigi korunur

### Frontend

- Process butonu job baslatir.
- Polling ile job status izlenir.
- Completed olunca preview/download gosterilir.
- Failed olunca kullanici dostu hata ve retry gosterilir.

### Acceptance Criteria

- Uzun islemde request timeout yasanmamali.
- Refresh sonrasi job durumu en azindan kisa sure geri alinabilmeli.
- Testlerde completed/failed job path'leri olmali.

## Faz 5: Kullanici Hesabi ve Proje Gecmisi

Bu faz opsiyonel ama profesyonel yayina cikmak icin onemlidir.

### Yapilacaklar

1. Basit auth
   - Email/password veya magic link.
   - Portfolio icin demo login de olabilir.

2. Kullanici projeleri
   - Yuklenen videolar
   - Olusturulan outputlar
   - Template ile yapilan dublajlar

3. Limitler
   - Anonim kullanici: gunde 3 export
   - Login kullanici: gunde 10 export
   - Admin/demo mod icin farkli limit

4. Veri saklama
   - Upload ve outputlar sonsuza kadar saklanmasin.
   - Kullaniciya saklama suresi gosterilsin.

### Acceptance Criteria

- Auth eklenirse endpointler test edilmeli.
- Hassas bilgi `.env` disinda tutulmamali.
- Rate limit veya export limit bypass edilememeli.

## Faz 6: Deployment ve Portfoy Paketi

Projenin profesyonel gorunmesi icin deploy ve sunum sart.

### Yapilacaklar

1. Docker
   - Backend Dockerfile
   - Frontend build
   - docker-compose
   - FFmpeg image icinde kurulu olmali

2. Environment
   - `.env.example` guncel olmali
   - `VITE_API_BASE_URL`
   - `ALLOWED_ORIGINS`
   - `MEDIA_ROOT`
   - `MAINTENANCE_TOKEN`

3. CI
   - GitHub Actions:
     - backend tests
     - frontend lint
     - frontend build
     - FFmpeg integration test

4. README
   - Demo GIF veya ekran goruntuleri
   - Canli demo linki
   - Kurulum
   - Ozellikler
   - Mimari
   - Test komutlari
   - Roadmap
   - Etik/telif notu
   - CV/LinkedIn aciklamasi

5. LICENSE
   - MIT veya Apache-2.0 ekle.

### Acceptance Criteria

- Yeni bir gelistirici README ile projeyi calistirabilmeli.
- GitHub repo ilk bakista profesyonel gorunmeli.
- CI yesil olmali.

## Yapilmayacaklar

- Gercek kisi ses klonlama ekleme.
- Telifli film/dizi/video template'i repoya koyma.
- Kullanici dosyalarini sure belirtmeden kalici saklama.
- Her seyi tek PR'da kontrolsuz sekilde degistirme.
- Mevcut calisan upload/process/download akislarini kirmak.

## Teknik Kalite Kurallari

- Backend'de servis sorumluluklarini ayir.
- FFmpeg komutlarini string concat ile guvensiz kurma; list arguman kullanmaya devam et.
- Path traversal risklerine dikkat et.
- Buyuk dosyalarda RAM'e komple alma.
- Turkce hata mesajlari kullan.
- Frontend'de TypeScript tiplerini koru.
- Loading, disabled, error, empty state ekle.
- Her faz icin test ekle.
- Degisiklikleri kucuk commitlere bol.

## Oncelik Sirasi

Eger zaman kisitliysa su sirayla ilerle:

1. FFmpeg timeout + maintenance token
2. README + demo GIF/screenshots + LICENSE
3. Template video sistemi
4. UI/UX profesyonellestirme
5. Job queue/progress
6. Docker + CI
7. Auth/proje gecmisi
8. Monetization/abonelik

## Ilk Sprint Gorevleri

Ilk sprintte sadece sunlari yap:

1. Repo yapisini incele ve kisa teknik not cikar.
2. FFmpeg timeout ekle.
3. Maintenance endpoint token korumasi ekle.
4. README'yi profesyonel hale getir.
5. LICENSE ekle.
6. GitHub Actions CI ekle.
7. Mevcut testleri calistir; gecmeyenleri duzelt.
8. Sonunda `RAPOR.md` olustur:
   - Yapilanlar
   - Degisen dosyalar
   - Test sonuclari
   - Kalan riskler
   - Sonraki sprint onerisi

## Codex/Antigravity Icin Cikis Formati

Calisma bittiginde su formatta rapor ver:

```md
# DublajLab Gelistirme Raporu

## Ozet

## Yapilan Degisiklikler

## Degisen Dosyalar

## Test Sonuclari

## Bilinen Riskler

## Sonraki 5 Adim
```

## Son Not

Bu proje para kazanmasa bile portfoy degeri olan bir urun gibi ele alinmali. Amac sadece ozellik eklemek degil; guvenilir, testli, anlatilabilir ve demo edilebilir bir yazilim ortaya cikarmaktir.
