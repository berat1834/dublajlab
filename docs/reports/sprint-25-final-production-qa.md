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
