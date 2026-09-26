# DublajLab Güvenli Demo Medya Planı

Bu belge, DublajLab projesi için portföy sunumlarında veya template galerisinde kullanılmak üzere telif riski taşımayan (safe) demo medyalarının nasıl hazırlanacağını detaylandırır.

## Temel Kriterler
- **Asla Kullanılmayacaklar:** Film, dizi, belgesel kesitleri, popüler sosyal medya videoları, memeler veya ticari müzik klipleri.
- **Güvenli Seçenekler:** Proje sahibinin kendi çektiği kamera kayıtları veya lisansı CC0 / Public Domain olarak onaylanmış %100 açık lisanslı içerikler.
- **Teknik Kısıtlar:** 
  - Format: MP4, MOV veya WEBM
  - Maksimum süre: 10-15 saniye (Hızlı demo ve optimizasyon için)
  - Boyut: < 5 MB ideal.

---

## Örnek Sahne Fikirleri ve Replik (Timeline) Planı

Eğer kendi kameranızla basit bir demo video hazırlayacaksanız, ev/ofis ortamında şu kısa sahneleri çekebilirsiniz:

### Sahne 1: Toplantı Faciası
**Video (12 saniye):** 
Bilgisayar başında kameraya bakıp (sanki online toplantıdaymış gibi) konuşuyorsunuz, sonra şaşırıp ağzınızı kapatıyorsunuz.
- **Replikler (`timeline.json`):**
  - `[00:00 - 00:04]` "Tüm gün süren o toplantı beş dakika sürecek dediler..."
  - `[00:04 - 00:08]` "Sonra herkes kahve molasına çıktı."
  - `[00:08 - 00:12]` "Ama bir baktım, benim mikrofonum açık kalmış!"

### Sahne 2: Başarısız Aşçı
**Video (10 saniye):**
Mutfakta elinizde boş bir tava ile duruyorsunuz, tavaya bakıp sonra kameraya dönüp çaresizce omuz silkiyorsunuz.
- **Replikler (`timeline.json`):**
  - `[00:00 - 00:04]` "Tarifte yazan her şeyi harfi harfine uyguladım."
  - `[00:04 - 00:09]` "Sonuçta ortaya bir taş çıkmasını beklemiyordum."

### Sahne 3: Gözlük Nerede?
**Video (10 saniye):**
Gözlüğünüz kafanızın üstündeyken, masanın üstünde sağa sola bakınarak bir şey arıyorsunuz.
- **Replikler (`timeline.json`):**
  - `[00:00 - 00:04]` "Sabahtan beri bu evde aramadığım yer kalmadı."
  - `[00:04 - 00:08]` "Gözlüğümü çalan biri olmalı!"

---

## Sisteme Entegrasyon Rehberi

Kendi videonuzu (Örn: `toplanti.mp4`) kaydettikten sonra projeye ekleme adımları:

1. **Dosyayı Kopyala:**
   Videoyu `frontend/public/templates/toplanti.mp4` konumuna koyun.

2. **Metadata Tanımla:**
   `backend/data/templates/templates.json` dosyasında şu formatta bir obje ekleyin:

```json
{
  "id": "toplanti-faciasi",
  "title": "Toplantı Faciası (Demo)",
  "category": "Komedi",
  "duration": "0:12",
  "lines_count": 3,
  "difficulty": "Kolay",
  "thumbnail_gradient": "from-blue-500 to-indigo-600",
  "video_url": "/templates/toplanti.mp4",
  "license": "Own work",
  "source": "Created by project owner for DublajLab demo",
  "default_lines": [
    {
      "id": "1",
      "text": "Tüm gün süren o toplantı beş dakika sürecek dediler...",
      "start_time": 0.0,
      "end_time": 4.0
    },
    {
      "id": "2",
      "text": "Sonra herkes kahve molasına çıktı.",
      "start_time": 4.0,
      "end_time": 8.0
    },
    {
      "id": "3",
      "text": "Ama bir baktım, benim mikrofonum açık kalmış!",
      "start_time": 8.0,
      "end_time": 12.0
    }
  ]
}
```

3. **Kontrol:**
   Değişikliği yaptıktan sonra `npm run build` ve `pytest` komutlarının sorunsuz çalıştığından emin olun.
