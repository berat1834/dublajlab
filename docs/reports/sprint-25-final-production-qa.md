# Sprint 25: Final Production Manual QA

**Canonical Canlı URL:** `https://dublajlab-sigma.vercel.app`

Aşağıdaki adımlar, projenin canlı (Production) versiyonunda son kullanıcı deneyimini uçtan uca doğrulamak için hazırlanmış **Manuel QA** (Kalite Kontrol) kontrol listesidir. 

> *Not: Bu QA süreci yapay zeka tarafından (Playwright altyapı eksikliği ve donanımsal mikrofon gereksinimi sebebiyle) otomatik yapılamamıştır. Lütfen testleri tarayıcınızda (Chrome/Edge/Safari vb.) gizli sekme veya normal sekme üzerinden uygulayın.*

## 📋 QA Kontrol Listesi

### Aşama 1: Temel Kullanıcı Akışı (Authentication & Navigation)
- [ ] **1. Ana Sayfa Yüklemesi:** `https://dublajlab-sigma.vercel.app` adresine gidildi. Sayfa hızlı ve hatasız açıldı.
- [ ] **2. Yeni Kullanıcı Kaydı:** Kayıt Ol (Register) formuna tıklandı. Geçerli e-posta, kullanıcı adı ve şifre ile kayıt başarıyla yapıldı.
- [ ] **3. Çıkış & Giriş (Login/Logout):** Yeni oluşturulan hesaptan çıkış yapıldı ve tekrar giriş yapılarak token mantığının çalıştığı (ve `/me` isteğinin gittiği) doğrulandı.

### Aşama 2: İçerik Oluşturma (Studio & Editor)
- [ ] **4. Template Galerisi:** Şablonlar (Templates) sekmesinde sistemdeki varsayılan dublaj şablonları listelendi.
- [ ] **5. Video Yükleme:** Şablon yerine, kendi cihazınızdan kısa bir (1-2 MB'lık) MP4 video yüklendi. Yükleme barı doldu ve stüdyo ekranı açıldı.
- [ ] **6. Mikrofon ile Kayıt:** Stüdyoda mikrofon izni verildi. 1-2 replik ses kaydedildi. Ses dalgaları/bölümleri zaman çizelgesinde göründü.

### Aşama 3: Export & İndirme Akışı
- [ ] **7. Export Başlatma:** "Dışa Aktar" butonuna basılarak video işleme kuyruğuna gönderildi (Railway üzerindeki background worker job tetiklendi).
- [ ] **8. Progress Polling:** Export işlemi sırasında uygulamanın "İşleniyor..." durumunu ekranda güncellediği (Polling) doğrulandı.
- [ ] **9. Preview & Download:** İşlem bittiğinde video önizleme oynatıcısında sorunsuz izlendi. "MP4 İndir" butonuna basılarak cihazınıza indirildi ve yerel video oynatıcıda (ör. VLC/QuickTime) sorunsuz izlendi (Sesler senkronize).

### Aşama 4: Platform İçi Etkileşim & Sosyal Özellikler
- [ ] **10. Kataloğum:** Profil menüsünden "Kataloğum"a gidildi, oluşturulan projenin (veya export'un) listede yer aldığı teyit edildi.
- [ ] **11. Public/Private Toggle:** Kataloğum'daki projenin gizlilik ayarı "Public" (Herkese Açık) olarak değiştirildi.
- [ ] **12. Dublajlar Feed (Keşfet):** Ana menüden "Dublajlar" (Keşfet) sayfasına gidildi. Public yapılan içeriğin akışta göründüğü teyit edildi.
- [ ] **13. Etkileşimler:** Dublaja Beğeni (Like) atıldı. Beğeni sayısı anında güncellendi. Yorum (Comment) eklendi ve listede göründü. Şikayet (Report) butonu ile içerik raporlandı.

### Aşama 5: Güvenlik, Moderasyon & Mobil Uyumluluk
- [ ] **14. Admin Temel Kontrol:** Admin yetkisi olmayan bir kullanıcı hesabı ile Admin paneline (`/admin` veya ilgili yönetim arayüzü) girilmeye çalışıldığında erişim engellendi. (403 Forbidden veya Ana sayfaya yönlendirme).
- [ ] **15. Mobil Görünüm:** Tarayıcı küçültülerek (veya telefon üzerinden girilerek) responsive (mobil uyumlu) yapının kırılmadan çalıştığı doğrulandı (Menü yapısı, dublaj stüdyosu).
- [ ] **16. Konsol & Network Kontrolü:** Tüm bu işlemler sırasında tarayıcının "DevTools > Console" sekmesinde kırmızı bir JavaScript hatası olmadığı doğrulandı.

---

## 🛠 Hata Raporlama (Bug Log)
Eğer yukarıdaki adımlardan herhangi birinde başarısızlık yaşarsanız, hatayı aşağıya not alın:
- 1. ...
- 2. ...

*(Tüm kutucuklar işaretlendiğinde proje resmi olarak lansmana/üretim aşamasına hazırdır!)*

## Production Blocker İncelemesi ve Düzeltmesi

26 Eylül 2026 tarihli manuel testte kullanıcı sesli export, `%55` seviyesinde
`Kayıtlar zaman çizelgesine yerleştiriliyor` mesajından sonra başarısız oldu.
Frontend, job `failed` durumunu üst bildirim dışında kalıcı bir sonuç panelinde
göstermediği için akış kullanıcı açısından sessizce durmuş gibi görünüyordu.

### Bulgular

- Başarısız job kimlikleri: `dc98bdb1-dc13-44af-ab97-5e41c9d1b996` ve
  `062cc324-7a05-4b6d-b210-fac805a8efbe`.
- Her iki job da backend yanıtında `failed`, `%55` ve FFmpeg hata metni döndürdü.
- Yüklenen videonun FFprobe süresi `5.208333` saniye, son replik bitişi `5.21`
  saniyeydi. Aradaki yaklaşık `0.001667` saniye yalnızca UI yuvarlamasıdır.
- Video `2560x1440` H.264 ve ses kanalı olmayan bir girdiydi.
- Eski hata ayrıştırması FFmpeg stderr çıktısının yalnızca son ilerleme satırını
  saklıyordu. Railway servisi 1 GB RAM ile sınırlı olduğundan, bulgular FFmpeg
  alt sürecinin yüksek çözünürlüklü encode sırasında kaynak sınırı nedeniyle
  sonlandırıldığına işaret ediyor.

### Uygulanan minimal düzeltme

- Timeline için `0.01` saniyelik tolerans tanımlandı. Bu aralıktaki yalnızca
  yuvarlama kaynaklı taşmalar video süresine kırpılıyor; daha büyük taşmalar
  frontend ve backend tarafından reddediliyor.
- Gerçek taşmada şu mesaj gösteriliyor: “Replik bitiş zamanı video süresini
  aşıyor. Lütfen son repliği video bitişinden önce tamamlayın.”
- Job `failed` durumu artık erişilebilir, görünür bir hata panelinde backend
  mesajıyla ve `Export’u tekrar dene` eylemiyle gösteriliyor.
- Backend job worker hataları job kimliğiyle logluyor; FFmpeg negatif dönüş
  kodları kaynak sınırı mesajına çevriliyor.
- Kullanıcı sesli export, en fazla `1920x1080`, `veryfast` preset ve tek FFmpeg
  thread ile çalıştırılarak production bellek baskısı azaltıldı.

### Otomatik doğrulama

- Backend: `70/70` pytest geçti.
- Hedefli backend ve gerçek FFmpeg entegrasyonu: `25/25` geçti.
- Frontend failed-job panel testi: `1/1` geçti.
- Frontend ESLint: geçti.
- TypeScript + Vite production build: geçti.

### Canlı tekrar test durumu

Düzeltme `701db517c0b4b53280ccd4341ba07ca03d2f8112` SHA'sıyla production'a
dağıtıldı. Railway deployment `14e24f0e-3bea-4026-820c-a849e9ad4f79`, Vercel
deployment `dpl_SyttjD87dDLFoPB8iM9bM2JetkzV` başarıyla tamamlandı.

- Canonical frontend `200`, backend `/api/health` `ok` döndürdü.
- Aynı `2560x1440`, `5.208333` saniyelik video; iki sentetik WebM mikrofon kaydı
  ve son replik `end=5.21` ile canlı export tamamlandı.
- Production job `2a286e88-8664-4778-9487-648275e64cea`, `%55` seviyesinden
  `%100 completed` durumuna geçti ve MP4 download URL üretti.
- `end=5.23` ile yapılan gerçek taşma kontrolü canlı backend'de `422` ve istenen
  Türkçe açıklamayı döndürdü.
- Canlı Vercel bundle'ında `Video oluşturulamadı` paneli ve timeline taşma mesajı
  bulundu.

API/FFmpeg production smoke testi başarılıdır. Sentetik WebM dosyaları tarayıcı
MediaRecorder çıktısıyla aynı codec/container yolunu sınar; fiziksel mikrofon
izni ve kullanıcının gerçek ses kaydıyla son kontrol tarayıcıda kullanıcı
tarafından tekrarlanmalıdır.
