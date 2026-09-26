# Sprint 13: Scene Detail Page & Template Preview UX

**Hedef:** DublajLab platformunda hazır sahnelerin listelendiği galeri (Template Gallery) ile dublaj stüdyosu (Timeline) arasına profesyonel bir "Sahne Detayları" ara katmanı eklemek. Amaç, kullanıcıya doğrudan stüdyo ekranını açmadan önce sahnenin önizlemesini, süresini, karakter sayısını ve kullanım istatistiklerini (demo) sunmaktır.

## Neler Yapıldı?
1. **Yeni `SceneDetail.tsx` Bileşeni:**
   - Sahneye özel bir önizleme (preview) alanı eklendi. `video_url` varsa gerçek MP4 oynatılır, yoksa seçili kategorinin renkleriyle uyumlu bir gradient placeholder gösterilir.
   - Başlık, kategori, açıklama, süre ve karakter sayısı gibi veriler sergilendi.
   - `play_count` (Oynanma Sayısı) değeri, eğer backend metadata'sında yoksa rastgele demo değerleriyle kullanıcıya gösterildi (ürünleşme hissiyatı).
   - "Tek başına oyna" ve "Bu sahneyle oda kur (Multiplayer)" CTA butonları eklendi. Oda kurma işlemi, gerçek backend olmadığı için Toast bildirimi ile placeholder olarak bırakıldı.
2. **Nasıl Oynanır (How to Play) UX:**
   - Detay ekranının altına 4 adımlı (Oda kur, Stüdyo, İşleme, Sonuç) modern bir grid rehber tasarlandı.
3. **VIP Sürüm Promosyon Alanı:**
   - Detay ekranının en altına, "Daha yüksek kalite export çok yakında" başlığıyla amber (altın) tonlarında bir VIP promo banner'ı eklendi. Amacı, projenin ürünleşme kapasitesini (monetization UI) göstermektir.
4. **Data Modeli (Backend):**
   - `models.py` içerisindeki `VideoTemplate` Pydantic modeline `play_count` ve `character_count` opsiyonel int alanları eklendi.
5. **App.tsx Navigasyonu:**
   - `activeTab` union type'ına `'scene_detail'` eklendi.
   - TemplateGallery üzerinden "Detayları gör" butonuna basıldığında stüdyoya geçmek yerine bu yeni `SceneDetail` ekranı açıldı.
   - Kullanıcı, bu detay sayfasından geri dönebilir ("Başka sahne seç") veya stüdyoya geçiş ("Tek başına oyna") yapabilir.

## Sonuç
Galeriden stüdyoya geçiş çok daha dolu, açıklayıcı ve profesyonel bir akışa sahip oldu. Platform, dublaj.io benzeri "seç -> incele -> başlat" mantığını gerçek yetenekleriyle yansıtır hale geldi.
