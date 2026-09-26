# Production Smoke Test Akışı

Canlı (Production) ortama çıkış yapıldıktan hemen sonra bu akışı baştan sona uygulayarak platformun çalıştığını doğrulayın. Herhangi bir adımda hata (500 vb.) alınıyorsa sistemi bakım moduna alıp rollback yapın.

## 1. Kayıt ve Giriş (Auth)
- Yeni bir e-posta ile kayıt ol (`Register`).
- Doğru şekilde giriş yapıp token alabildiğini doğrula (`Login`).
- Sağ üstte "Kataloğum" ve isminin göründüğüne emin ol.

## 2. Core Akış (Upload & Record)
- Stüdyo sekmesine git.
- Küçük bir MP4 veya WebM video yükle (ör. 5 saniyelik).
- Mikrofon erişimi ver ve bir satır ses kaydet (Timeline'a düşmeli).
- `Dublajı Dışa Aktar` butonuna bas ve işlemin `%100` olup tamamlanmasını bekle.
- Çıktı videonun frontend üzerinde oynatılabildiğini ve "İndir" butonunun çalıştığını onayla.

## 3. Kullanıcı Kütüphanesi (Kataloğum)
- "Kataloğum" sekmesine git.
- Yeni yaptığın dublajın "Tamamlandı" statüsünde orada durduğunu gör.
- İsteğe bağlı: Dosyayı oradan da indirip test et.

## 4. Sosyal Etkileşimler (Public & Feed)
- Kataloğum sayfasındaki dublajını "Açık" (Public) durumuna getir.
- "Dublajlar" (ShowcaseDubs) sekmesine git.
- Videonun topluluk akışında göründüğünü teyit et.
- Kartın sağ altındaki "Play" (İzlenme) alanına tıklayarak videoyu izle ve **Görüntülenme Sayısının** (View) arttığını doğrula.
- **Kalp** (Beğeni) butonuna bas ve sayının arttığını, ikonun renginin değiştiğini gör.
- **Yorumlar** sekmesine tıkla, 1-2 kelimelik bir deneme yorumu at, ekranda göründüğünü teyit et.
- Yorumunun yanındaki silme ikonuna basıp gizlenebildiğini doğrula.

## 5. Moderasyon (Report & Admin)
- Aynı public dublaj kartındaki "Bayrak" (Report) ikonuna tıkla, test amaçlı bir şikayet yolla.
- Kendi hesabının veritabanından rolünü `admin` yap (veya admin hesabı ile login ol).
- "Admin Paneli"ne gir, yollanan report'un orada olduğunu teyit et.
- "Projeyi Gizle" (Hide) butonuna bas.
- "Dublajlar" sekmesine geri dönüp o videonun public feed'den düştüğünü doğrula.

## 6. Çıkış (Logout)
- Sağ üstten Çıkış (Logout) yap.
- Token'ın local storage'dan silindiğini ve Navbar'ın "Giriş Yap" durumuna döndüğünü teyit et.

Tebrikler! Sistem sağlıklı çalışıyor.

## İlk Deployment Denemesi Sonucu — 26 Eylül 2026

Bu akış gerçek hosting ortamında henüz çalıştırılmadı. İlk deneme; kırmızı GitHub CI, commitlenmemiş Faz 16–21 çalışma ağacı ve provider oturumu eksikliği nedeniyle production URL oluşturulmadan durduruldu. Yerel Docker pre-deploy smoke testinin başarılı olması production smoke testi yerine geçmez. Gerçek sonuçlar deploy tamamlandıktan sonra bu bölüme tarih, URL ve her adımın `passed/failed` durumu ile eklenecektir.
