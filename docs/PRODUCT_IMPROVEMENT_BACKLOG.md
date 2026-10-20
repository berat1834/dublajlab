# DublajLab Ürün İyileştirme Listesi

Bu liste 19 Ekim 2026 kullanıcı kabul gözlemlerini karar, öncelik ve doğrulama
ölçütleriyle takip eder. Maddeler tek tek uygulanır; her madde test ve canlı kontrol
sonrasında kapatılır.

## Uygulama sırası

1. **Altyazı zamanlaması ve replik başlangıç deneyimi — tamamlandı (19 Ekim 2026, P0)**
   - Karar: Altyazı video boyunca değil, yalnızca ait olduğu repliğin başlangıç ve
     bitiş zamanı arasında görünür; replikler arasındaki boşlukta görünmez.
   - Başlangıçta videoyu boşluksuz bölen örnek replikler yerine tek, en fazla üç
     saniyelik boş replik açılır.
   - “Replik 1” gibi silinmesi gereken gerçek metin yerine yalnızca placeholder
     gösterilir.
   - Sayısal zaman alanına odaklanınca mevcut değer seçilir; `0` doğrudan yeni
     değerle değiştirilebilir.
2. **VIP hesapta AI ses yetkisi — tamamlandı (20 Ekim 2026, P0)**
   - Production incelemesinde VIP yetkisinin doğru çalıştığı, ancak yetkinin açık
     oturumdaki hesaptan farklı bir hesaba verildiği doğrulandı.
   - AI ses seçilirken `/me` üyelik durumu yeniden alınır; sekme yeniden görünür
     olduğunda üyelik otomatik tazelenir.
   - VIP olmayan oturumda genel uyarı yerine hangi hesabın VIP olmadığı açıkça
     gösterilir. Backend yetki kontrolü değişmeden korunur.
3. **Katalog videolarını tarayıcıda oynatma — sıradaki (P0)**
   - Karar: İndirilebilen katalog videosu aynı zamanda uygulama içinde de
     oynatılabilmeli; indirme tek seçenek olması normal kabul edilmiyor.
   - R2/CORS, `Content-Type`, URL üretimi ve mobil video oynatıcı kontrol edilecek.
4. **Uyarı bildirimleri — planlandı (P1)**
   - Mor kutular sabit, güvenli alanları hesaba katan, yüksek kontrastlı ve tüm
     cihazlarda görünür bir toast bileşenine dönüştürülecek.
   - Başarı, bilgi, uyarı ve hata türleri; kapatma düğmesi ve erişilebilir canlı
     bölge desteği olacak.
5. **Sıralama ve filtre kontrolleri — planlandı (P1)**
   - Basit yerel `select` yerine ikonlu, açıklayıcı ve mobilde rahat kullanılan
     kontrol tasarlanacak. Klavye ve odak durumları korunacak.
6. **Girişsiz dublaj politikası — karar verildi (P1)**
   - Karar: Kısıtlı ve geçici public demo girişsiz kalır; kalıcı proje, kütüphane,
     topluluk yayını, yüksek limitler ve VIP özellikleri giriş gerektirir.
   - Böylece ilk deneme sürtünmesiz kalırken kötüye kullanım hız/IP limitleriyle
     sınırlandırılır.
7. **Mobil ürün — keşif (P2)**
   - İlk adım ayrı native uygulama değil; mevcut web uygulamasını kurulabilir PWA,
     güvenilir mobil kayıt ve paylaşım akışı olarak tamamlamaktır.
   - Kullanım verisi yeterli talep gösterirse daha sonra native uygulama değerlendirilir.
8. **Destek e-posta adresi — tamamlandı (19 Ekim 2026)**
   - `destek@dublajlab.com.tr`, `hesap@dublajlab.com.tr` posta kutusuna yönlenen
     ProMail rumuzu olarak oluşturuldu.
   - Gerçek teslimat ve Resend webhook `email.delivered` olayı doğrulandı.
   - Production `RESEND_REPLY_TO` bu adrese geçirildi.
9. **Günlük seri, görev ve başarımlar — ürün keşfi (P2)**
   - Ekran görüntüsündeki fikir doğrudan kopyalanmayacak. Önce temel oluşturma,
     VIP ve oynatma sorunları kapatılacak.
   - Sonrasında kullanıcıyı spam üretmeye yöneltmeyen; ilk dublaj, farklı sahne,
     geri bildirim ve düzenli üretim odaklı hafif görev/seri sistemi tasarlanabilir.

## Tamamlanma kuralı

Her madde kod incelemesi, otomatik testler, masaüstü ve mobil görünüm kontrolü ile
production smoke testinden sonra “tamamlandı” durumuna geçirilir.
