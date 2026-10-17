# DublajLab Ürün Sağlamlaştırma Yol Haritası

Bu liste 17 Ekim 2026 tarihinde canlı ürünün güvenlik, işletim ve kullanıcı
deneyimi ihtiyaçları için öncelik sırasına göre oluşturuldu. Maddeler birbirine
karışmadan, test ve canlı doğrulaması tamamlandıktan sonra tek tek kapatılır.

## Sıralı işler

1. **Parola sıfırlama — devam ediyor**
   - Tek kullanımlık, hash'lenmiş ve 30 dakika geçerli token.
   - Hesap varlığını açıklamayan yanıt ve istek hız sınırı.
   - TR/EN arayüz ile seçilen dilde Resend e-postası.
   - Yeni parola politikası, eski oturumları geçersiz kılma ve Alembic migration.
   - Tam test, CI, production deploy ve canlı e-posta denemesiyle kapanacak.
2. **Oturum güvenliği — sırada**
   - JWT'yi `localStorage` yerine HttpOnly, Secure, SameSite çereze taşı.
   - Bunun için API'yi `api.dublajlab.com.tr` gibi aynı site altında yayınla veya
     Vercel üzerinden güvenli bir backend-for-frontend proxy kullan.
   - CSRF koruması, token yenileme/rotasyon ve kontrollü çıkış ekle.
3. **Production secret temizliği**
   - Resend aktifken kullanılmayan `SMTP_*` değişkenlerini Railway'den kaldır.
   - Anahtar rotasyonu ve minimum yetki kontrolünü kaydet.
4. **İzleme ve alarm**
   - Uygulama hata takibi, uptime kontrolü, Railway kaynak alarmı.
   - Resend bounce/complaint webhook'u ve görünür teslimat metriği.
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
