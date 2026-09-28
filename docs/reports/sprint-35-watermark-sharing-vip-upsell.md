# Sprint 35: Watermark + External Sharing + VIP Upsell

## 1. Amaç
- Free ve anonim kullanıcılar için exportlarda "DublajLab" watermark'ının gösterilmesi (VIP kullanıcıları teşvik etmek amacıyla).
- Export tamamlandığında kullanıcıların oluşturdukları medyayı dış platformlarda (TikTok, X, Instagram Reels) kolayca paylaşabilmesini sağlayan butonlar eklenmesi.
- Free kullanıcılara, filigransız video ve 1080p gibi özelliklere dikkat çeken küçük, şık bir VIP Upsell alanı sunulması.

## 2. Yapılan Değişiklikler

### Backend
- **FFmpeg Entegrasyonu:** `ffmpeg_service.py` üzerindeki video ve kayıt birleştirme komutlarına `add_watermark` parametresi eklendi. True olduğunda `drawtext` filtresi (sağ alt köşe, yarı şeffaf, gölgeli metin) devreye alınıyor.
- **Job Service:** `run_ai_job` ve `run_recording_job` metotlarına `membership_tier` bilgisi taşındı. Kullanıcının üyelik durumuna göre `(membership_tier != "vip")` şartıyla watermark parametresi FFmpeg'e geçirildi.
- **Kısıtlamalar:** AI destekli dublajlar halihazırda sadece VIP kullanıcılara açık olduğundan, AI dublaj exportlarında mantıksal olarak `membership_tier == "vip"` geçiliyor. Manuel ses kayıt dublajlarında ise Free kullanıcılar için doğrudan watermark işleniyor.
- **Testler:** `test_jobs_api.py` ve `test_video_api.py` dosyalarındaki mock FFmpeg komutları (*_args, **kwargs*) yeni FFmpeg parametrelerini (`max_video_width` vb.) destekleyecek şekilde güncellendi. Tüm backend testleri %100 başarılı.

### Frontend
- **UI Geliştirmeleri:** `JobSuccessPanel` mantığını içeren `App.tsx` içerisindeki output alanına yeni `Link`, `TikTok`, `IG Reels` ve `X'te Paylaş` eylem butonları eklendi.
- **Paylaşım Entegrasyonları:**
  - *Bağlantı Kopyala:* `navigator.clipboard.writeText` ile doğrudan link panoya kopyalanır.
  - *X (Twitter):* Twitter'ın web intent URL'sine yönlendirilir.
  - *TikTok & Reels:* Bu platformların web'den video paylaşımı kısıtlı olduğundan (API erişimleri de sınırlı), kullanıcılara dosyayı indirmeleri ve uygulamaları üzerinden paylaşmaları gerektiğini belirten yönlendirici bilgilendirme toast'ları eklendi.
- **VIP Upsell:** `!hasVip` durumundaki kullanıcılar için export tamamlandıktan sonra görünen sonuç paneli içerisine, dikkat dağıtmayan ancak 1080p/filigransız avantajlarını vurgulayan "VIP'ye Geç" paneli eklendi.

## 3. Test Sonuçları
- **Backend pytest:** `python -m pytest backend/tests -q` çalıştırıldı. Sonradan oluşan mock hatası fixlenerek tüm testler (100%) yeşil duruma getirildi.
- **Frontend lint / build:** `npm run lint` ve `npm run build` ile TypeScript/React hataları kontrol edildi, başarıyla tamamlandı.

## 4. Kalan Riskler ve Sonraki Adımlar
- **Font Kısıtlamaları:** Sunucu (Railway) üzerindeki Docker/Nixpacks FFmpeg dağıtımında varsayılan fontlar eksikse `drawtext` filtresi hata verebilir. Geçerli sistem fontlarına göre ya da projeye manuel bir .ttf dosyası dahil edilerek bu durum kalıcı hale getirilebilir (şu an varsayılan font bekleniyor).
- Sosyal ağlara web üzerinden doğrudan API ile içerik gönderimi (TikTok/IG vb.) kurumsal app gerektirdiğinden, kullanıcıları indirmeye yönlendirmek en sağlıklı MVP stratejisidir. İleride mobil uygulama (React Native vb.) çıkarsa Native Share API kullanılarak pürüzsüzleştirilebilir.
