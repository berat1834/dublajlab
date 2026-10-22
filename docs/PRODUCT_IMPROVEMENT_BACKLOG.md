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
3. **Katalog videolarını tarayıcıda oynatma — tamamlandı (20 Ekim 2026, P0)**
   - Karar: İndirilebilen katalog videosu aynı zamanda uygulama içinde de
     oynatılabilmeli; indirme tek seçenek olması normal kabul edilmiyor.
   - Katalog metadata'sındaki gerçek video adresleri bağlandı.
   - Örnek videolar mobil uyumlu H.264 `yuv420p` ve fast-start biçimine çevrildi.
   - Sahne detay oynatıcısına satır içi oynatma ve anlaşılır yükleme hatası eklendi.
   - Canlı API URL üretimi, `Content-Type`, byte-range desteği ve mobil video codec'i
     doğrulandı.
4. **Uyarı bildirimleri — tamamlandı (20 Ekim 2026, P1)**
   - Mor kutular sabit, güvenli alanları hesaba katan, yüksek kontrastlı ve tüm
     cihazlarda görünür bir toast bileşenine dönüştürüldü.
   - Başarı, bilgi, uyarı ve hata türleri; kapatma düğmesi ve erişilebilir canlı
     bölge desteği eklendi; üst üste gelen zamanlayıcılar da temizleniyor.
5. **Sıralama ve filtre kontrolleri — tamamlandı (21 Ekim 2026, P1)**
   - Basit yerel `select`, ikonlu ve açıklayıcı üçlü sıralama kontrolüyle değiştirildi.
   - Arama, yatay kaydırılabilen kategori çipleri ve sıralama tek bir duyarlı panelde
     toplandı; klavye odağı ve `aria-pressed` durumları eklendi.
   - Filtreleme ve sıralama saf bir yardımcıya taşındı; API'den gelen dizi artık
     yerinde değiştirilmez ve Türkçe arama yerel harf kurallarını kullanır.
6. **Girişsiz dublaj politikası — tamamlandı (22 Ekim 2026, P1)**
   - Karar: Kısıtlı ve geçici public demo girişsiz kalır; kalıcı proje, kütüphane,
     topluluk yayını, yüksek limitler ve VIP özellikleri giriş gerektirir.
   - Böylece ilk deneme sürtünmesiz kalırken kötüye kullanım hız/IP limitleriyle
     sınırlandırılır.
   - Demo modu kapalıyken anonim upload ve mikrofon export istekleri `401` ile
     durdurulur; demo açıkken yalnızca misafir isteklerine düşük medya ve günlük
     export limitleri uygulanır.
   - Giriş yapan hesaplar normal üyelik medya limitlerini kullanır; arayüzdeki demo
     sınırı paneli ve istemci tarafı düşük limitler oturum açılınca kaldırılır.
7. **Mobil ürün — uygulanıyor (P2)**
   - İlk adım ayrı native uygulama değil; mevcut web uygulamasını kurulabilir PWA,
     güvenilir mobil kayıt ve paylaşım akışı olarak tamamlamaktır.
   - Web manifesti ve uygulama ikonlarına service worker eklendi; uygulama çevrimdışı
     durumda kabuğunu açabilir. API yanıtları, kullanıcı medyası ve videolar güvenlik
     ve güncellik için önbelleğe alınmaz.
   - Android/masaüstünde yerel kurulum istemi, iOS'ta “Ana Ekrana Ekle” yönlendirmesi
     ve destekleyen mobil cihazlarda sistem paylaşım menüsü eklendi.
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
