# DublajLab Ürün Sağlamlaştırma Yol Haritası

Bu liste 17 Ekim 2026 tarihinde canlı ürünün güvenlik, işletim ve kullanıcı
deneyimi ihtiyaçları için öncelik sırasına göre oluşturuldu. Maddeler birbirine
karışmadan, test ve canlı doğrulaması tamamlandıktan sonra tek tek kapatılır.

## Sıralı işler

1. **Parola sıfırlama — tamamlandı (17 Ekim 2026, PR #16)**
   - Tek kullanımlık, hash'lenmiş ve 30 dakika geçerli token.
   - Hesap varlığını açıklamayan yanıt ve istek hız sınırı.
   - TR/EN arayüz ile seçilen dilde Resend e-postası.
   - Yeni parola politikası, eski oturumları geçersiz kılma ve Alembic migration.
   - Hedefli 41/41 test, tam backend paketi, migration zinciri, main CI,
     Railway/Vercel deploy ve canlı endpoint kontrolleri geçti.
2. **Oturum güvenliği — sırada; altyapı önkoşulu var**
   - JWT'yi `localStorage` yerine HttpOnly, Secure, SameSite çereze taşı.
   - Önerilen yol: Railway servisini `api.dublajlab.com.tr` altında yayınla;
     Hosting.com.tr DNS, Vercel API adresi ve Google/Discord yetkili callback
     adreslerini birlikte güncelle.
   - Alternatif: Vercel üzerinden backend-for-frontend proxy ve OAuth için kısa
     ömürlü, tek kullanımlık oturum değişim kodu uygula.
   - CSRF koruması, token yenileme/rotasyon ve kontrollü çıkış ekle.
3. **Production secret temizliği**
   - Resend aktifken kullanılmayan `SMTP_*` değişkenlerini Railway'den kaldır.
   - Anahtar rotasyonu ve minimum yetki kontrolünü kaydet.
4. **İzleme ve alarm**
   - Uygulama hata takibi, uptime kontrolü, Railway kaynak alarmı.
   - Resend bounce/complaint webhook'u ve görünür teslimat metriği.
   - GitHub Actions'ta Node 20 kullanan `checkout/setup-*` action sürümlerini,
     sağlayıcıların Node 24 uyumlu yeni major sürümleriyle güncelle.
5. **Yedekleme ve geri yükleme tatbikatı**
   - PostgreSQL yedeğinin gerçekten geri yüklenebildiğini doğrula.
   - R2/S3 production yükleme-indirme-silme smoke testini tekrarla.
6. **Onboarding, mobil ve erişilebilirlik**
   - İlk kullanım yönlendirmesi, boş durumlar ve anlaşılır hata mesajları.
   - Klavye, odak, ekran okuyucu, kontrast ve küçük ekran QA.
7. **Shopier production ödeme doğrulaması**
   - Gerçek düşük tutarlı ödeme, callback/webhook, iptal/iade ve üyelik süresi.
   - Mesafeli satış, KVKK ve iade metinleri için hukuki kontrol.
8. **Yeni özellikler**
   - Yalnızca lisansı ticari kullanıma uygun bir dudak senkronizasyonu sağlayıcısı.
   - Önce yukarıdaki güvenlik ve operasyon işleri tamamlanmalı.

## Uygulama kuralı

Her madde ayrı branch/PR, otomatik testler, migration kontrolü, deploy durumu ve
canlı smoke testiyle tamamlanır. Bir madde canlıda doğrulanmadan sonraki madde
production'a alınmaz.
