# DublajLab uçtan uca smoke test

Bu kontrol, gerçek FFmpeg, gerçek video ve gerçek tarayıcı mikrofonuyla ana MVP akışını doğrular. Komutları proje kökü olan `C:\src\Meme Dublaj Studio MVP` altında çalıştırın.

## 1. Ön kontroller

Yeni bir PowerShell açın:

```powershell
ffmpeg -version
ffprobe -version
.\.venv\Scripts\python.exe -c "import fastapi, uvicorn; print('Backend bağımlılıkları hazır')"
```

FFmpeg yolu ayrıca şöyle görülebilir:

```powershell
where.exe ffmpeg
where.exe ffprobe
```

## 2. Backend'i açın

Birinci PowerShell penceresinde:

```powershell
cd "C:\src\Meme Dublaj Studio MVP"
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
```

Terminali açık bırakın. Tarayıcıdan `http://localhost:8000/api/system/ffmpeg` adresini açın. Beklenen temel sonuç:

```json
{
  "available": true,
  "message": "FFmpeg ve FFprobe kullanıma hazır."
}
```

`available: false` görünürse backend çalışmaya devam eder fakat video upload/process istekleri Türkçe `503` hatası döndürür.

## 3. Frontend'i açın

İkinci PowerShell penceresinde:

```powershell
cd "C:\src\Meme Dublaj Studio MVP\frontend"
npm run dev
```

Chrome veya Edge'de `http://localhost:5173` adresini açın. URL'yi PowerShell'e komut olarak yazmayın; tarayıcının adres çubuğunu kullanın.

## 4. Test videosunu yükleyin

1. `demo/` klasörüne kendi çektiğiniz 5–15 saniyelik bir MP4 koyun.
2. DublajLab'da videoyu sürükleyip bırakın.
3. Video önizlemesinin açıldığını ve sürenin doğru göründüğünü kontrol edin.
4. Dosyanın 50 MB'dan, sürenin 60 saniyeden küçük olduğundan emin olun.

## 5. İki replik kaydedin

1. Timeline'da iki replik bırakın; fazlasını silin veya iki yeni satır oluşturun.
2. Örnek zamanları ayarlayın:
   - `line-1`: `start=0.5`, `end=2.5`
   - `line-2`: `start=3.0`, `end=5.0`
3. Her satıra farklı ve kolay ayırt edilir bir metin yazın.
4. İlk satırda **Kaydı başlat** düğmesine basın.
5. Tarayıcının mikrofon iznini **İzin ver** olarak yanıtlayın.
6. Metni okuyun; kayıt slot sonunda otomatik durmalı.
7. Oluşan audio player ile kaydı dinleyin.
8. İkinci replik için işlemi tekrarlayın.
9. Bir kayıtta **Yeniden kaydet** davranışını da kontrol edin.

Kulaklık kullanmak, video sesinin mikrofona geri girmesini önler.

## 6. Export alın

1. İlk denemede **Orijinal sesi tamamen kapat** seçeneğini açık bırakın.
2. **Altyazıları videoya göm** seçeneğini açık bırakın.
3. **Kendi Sesimle Videoyu Oluştur** düğmesine basın.
4. İşlem tamamlanınca sonuç player'ını oynatın.
5. **MP4 indir** ile çıktıyı kaydedin.

## 7. Beklenen sonuç

- Video görüntüsü kaynak videoyla aynı süreye yakın olmalı.
- İlk kayıt yalnızca ilk zaman aralığında, ikinci kayıt yalnızca ikinci aralıkta duyulmalı.
- Replikler doğru zamanlarda altyazı olarak görünmeli.
- Sağ üstte küçük `DublajLab` watermark'ı bulunmalı.
- Orijinal sesi kapatma açıkken kaynak ses duyulmamalı.
- İndirilen dosya MP4 olmalı ve telefon/Chrome/VLC'de oynatılabilmeli.

İkinci export'ta orijinal sesi kapatma seçeneğini kaldırın. Bu kez kaynak ses düşük seviyede, mikrofon kayıtları önde duyulmalıdır.

## 8. Otomatik ve gerçek FFmpeg kontrolü

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests/test_ffmpeg_integration.py -v
```

Bu test gerçek FFmpeg ile sentetik video ve WebM/Opus kayıtları üretir, aynı production filter graph'ını çalıştırır ve MP4 çıktısını FFprobe ile doğrular. Fiziksel mikrofonu test etmez; mikrofon izni ve MediaRecorder davranışı için yukarıdaki tarayıcı akışı gereklidir.

## 9. Test dosyalarını temizleme

24 saatten eski runtime dosyalarını Swagger üzerinden veya PowerShell ile temizleyin:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/api/maintenance/cleanup?older_than_hours=24"
```

Bu işlem geri alınamaz; sadece çalışma klasörlerindeki eşikten eski medya ve metadata dosyalarını hedefler.

