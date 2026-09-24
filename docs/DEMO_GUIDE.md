# DublajLab Demo ve Portföy Rehberi

Bu rehber, DublajLab için telif açısından güvenli bir demo videosu, template kaydı, ekran görüntüsü ve kısa portföy GIF'i hazırlama adımlarını açıklar.

## 1. Demo videosunu hazırlama

En güvenli seçenek videoyu kendiniz üretmektir. Telefonla çekilmiş kısa, yüz içermeyen bir masa/ürün sahnesi; kendi hazırladığınız basit animasyon; ya da yalnızca DublajLab arayüzünün ekran kaydı kullanılabilir.

Önerilen teknik sınırlar:

- MP4/H.264, MOV veya WEBM
- 5–15 saniye; sistem üst sınırı 60 saniye
- 720p veya 1080p
- 50 MB altında
- Konuşmasız ya da kullanım izni size ait ses
- Başka kişilere ait yüz, logo, müzik ve özel bilgi içermeyen kadraj

Yerel deneme için videoyu `demo/input/` klasörüne koyun. Bu klasördeki medya `.gitignore` tarafından Git dışında tutulur. İşlenmiş sonucu inceleme amacıyla `demo/output/` altında saklayabilirsiniz; bu klasördeki çıktılar da commit edilmez.

## 2. Lisans ve kaynak bilgisini yazma

Her template için `license` ve `source` zorunludur.

Kendi üretiminiz için:

```json
"license": "All rights reserved — proje sahibinin kendi üretimi",
"source": "Berat — özgün demo çekimi — 2026-09-24"
```

Açık lisanslı bir kaynak için:

```json
"license": "CC BY 4.0",
"source": "Üretici adı — https://kaynak.example/video — erişim: 2026-09-24"
```

Lisans; yeniden dağıtıma, düzenlemeye ve türetilmiş video üretmeye izin vermelidir. Atıf gerekiyorsa üretici adı ile kaynak bağlantısı korunmalıdır. “Google”, “YouTube” veya “internetten bulundu” kaynak değildir.

## 3. Videoyu template sistemine bağlama

1. Yayınlama hakkını doğruladığınız dosyayı `frontend/public/templates/` klasörüne kopyalayın. Klasör yoksa oluşturun.
2. Dosya adında küçük harf, rakam ve tire kullanın: `my-demo-scene.mp4`.
3. `demo/metadata/template.example.json` dosyasını örnek alarak bir metadata kaydı hazırlayın.
4. Kaydı `backend/data/templates/templates.json` içindeki JSON listesine ekleyin.
5. `video_url` değerini frontend public klasörüne göre yazın:

```json
"video_url": "/templates/my-demo-scene.mp4"
```

6. `duration_seconds` değerini gerçek video süresiyle eşleştirin.
7. Her replik için `start >= 0`, `end > start` ve `end <= duration_seconds` koşullarını sağlayın.
8. Replik kimliklerini template içinde benzersiz tutun; toplam replik sayısı 1–20 arasında olmalıdır.

Template seçildiğinde frontend bu dosyayı mevcut upload endpoint'ine gönderir. Böylece ayrı bir medya işleme hattı kurulmadan normal kayıt ve FFmpeg export akışı kullanılır.

## 4. Ekran görüntüsü ve GIF hazırlama

Portföy dosyaları için hedef yollar:

- `docs/assets/dublajlab-editor.webp`
- `docs/assets/dublajlab-template-gallery.webp`
- `docs/assets/dublajlab-mobile.gif`

Ekran görüntüsünde kaynak video, kayıt durumları ve export sonucu mümkünse tek akışta gösterilmelidir. GIF kısa tutulmalı; yükleme → replik kaydı → sonuç adımlarını göstermelidir. Kişisel dosya yolu, mikrofon cihaz adı, terminal token'ı veya özel tarayıcı sekmeleri görünmemelidir.

## 5. Telifli içerik neden eklenmemeli?

Film, dizi, reklam, müzik klibi, YouTube/TikTok/Instagram videosu veya lisansı belirsiz meme kesitleri; kısa olmaları ya da eğitim amaçlı kullanılmaları nedeniyle otomatik olarak serbest hale gelmez. Bunları repoya eklemek kaldırma talebi, GitHub bildirimi ve portföy güvenilirliğinin zarar görmesi riskini doğurur.

Lisans kesin değilse dosyayı eklemeyin. Metadata içinde `video_url: null` bırakmak güvenli ve desteklenen seçenektir.

## 6. Yayın öncesi kontrol

Proje kökünde:

```powershell
.\.venv\Scripts\python.exe -m pytest backend/tests -q
cd frontend
npm run lint
npm run build
```

Ardından template kartındaki lisans/kaynak bilgisini, videonun oynatılmasını, iki mikrofon kaydını ve MP4 export'u manuel olarak doğrulayın.
