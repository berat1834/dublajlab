# DublajLab Canlı Demo & Portföy Sunum Rehberi

Bu belge, DublajLab projesini LinkedIn, GitHub veya kişisel portföyünüzde sergilerken kullanılacak 20-30 saniyelik video senaryosunu ve 8-15 saniyelik GIF kurgusunu açıklamaktadır.

## ⚠️ Telif Uyarısı
**Önemli Not:** Canlı demo, GIF veya ekran görüntüleri için **kesinlikle telif hakkı bulunan (film, dizi, sosyal medya kesiti, müzik)** materyal kullanmayın. Yalnızca kendi çektiğiniz kısa bir video, açık lisanslı (CC0) bir görüntü veya projede bulunan dummy/placeholder (örneğin CSS gradient) öğeleri üzerinden çekim yapın.

---

## 1. Kısa Demo Videosu Senaryosu (20 - 30 Saniye)

Bu video, LinkedIn paylaşımınızda projenin ne işe yaradığını en hızlı anlatan "Hero" içerik olacaktır.

### Adım Adım Akış:
1. **0s - 5s (Giriş & Platform Keşfi):**
   - Ana sayfadaki (Oyna) güçlü hero mesajı gösterilir.
   - Sahneler sekmesine tıklanıp galerideki filtrelemeler (Komedi, Dram) 1-2 saniye gösterilir.
   - Ardından "Dublaj yap" butonuna tıklanarak stüdyo ekranına geçilir.

2. **5s - 15s (Replik Kaydı):**
   - Kayıt ekranında sağdaki Timeline'a odaklanılır.
   - 1. satır için mikrofona tıklanır, 2 saniyelik bir kayıt yapılır (kırmızı kayıt animasyonu vurgulanır).
   - "Sonraki Replik" geçişi ile timeline ilerlemesi gösterilir.

3. **15s - 23s (Export ve Job Queue):**
   - Tüm replikler bitince "Dublajı tamamla ve videoyu oluştur" butonuna basılır.
   - Polling ekranı (Gerçek job durumu %0'dan %100'e giden progress bar) gösterilir. (Bu aşama izleyiciye backend/job mimarisi gücünü yansıtır).

4. **23s - 30s (Sonuç):**
   - Sonuç ekranı açılır. MP4 oynatıcıda video 3 saniye çalar (sesler mikslenmiş ve altyazı gömülmüş halde).
   - Mouse "MP4 indir" butonuna gider ve video biter.

---

## 2. GitHub README GIF Senaryosu (8 - 15 Saniye)

GitHub reposunu gezen yazılımcıların dikkatini çekmek için daha hızlı ve loop'a uygun bir GIF kurgusu:

- **1 - 3s:** Sahneler'den hızlıca bir video seçilir ve stüdyo açılır.
- **3 - 8s:** Tek bir repliğe mikrofon ikonuna tıklanıp kayıt atılır, anında "Oluştur" butonuna basılır.
- **8 - 12s:** Progress bar'ın hızla dolması (Job polling).
- **12 - 15s:** Sonuç MP4'ü indirme sayfasının belirip GIF'in başa dönmesi.

---

## 3. Gösterilecek Temel Ekranlar (Screenshots için)

Eğer video veya GIF kullanamıyorsanız (veya README için statik görsel lazımsa), şu akışı yakalayacak sabit görseller elde edin:
1. **Landing / Hero:** Navbar, giriş/kayıt CTA'ları ve platform hissi.
2. **Sahneler Galerisi:** Dinamik filtreler ve mock kartlar.
3. **Dublajlar Showcase:** Kullanıcı içerikleri varmış gibi duran placeholder vitrin.
4. **Günün Dublajı:** Dev boyutlu play butonu olan vitrin kartı.
5. **Recording Timeline:** Aktif mikrofon / kayıt durumu / timeline ilerlemesi.
6. **Export Result:** Başarı ekranı ve indirme butonu.
7. **Mobil Navbar / Landing:** Telefon görünümü, hamburger menü.

Bu rehberi izleyerek, hem teknik zorlukları (FFmpeg, Job Queue, React) hem de estetik ürünü (Platform Shell, Glassmorphism) portföyünüzde eksiksiz yansıtabilirsiniz.
