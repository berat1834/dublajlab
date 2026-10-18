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
2. **Oturum güvenliği — tamamlandı (18 Ekim 2026)**
   - JWT'yi `localStorage` yerine HttpOnly, Secure, SameSite çereze taşı.
   - Önerilen yol: Railway servisini `api.dublajlab.com.tr` altında yayınla;
     Hosting.com.tr DNS, Vercel API adresi ve Google/Discord yetkili callback
     adreslerini birlikte güncelle.
   - Alternatif: Vercel üzerinden backend-for-frontend proxy ve OAuth için kısa
     ömürlü, tek kullanımlık oturum değişim kodu uygula.
   - CSRF koruması, token yenileme/rotasyon ve kontrollü çıkış ekle.
   - 17 Ekim 2026, PR #18: HttpOnly/Secure/SameSite çerez, Origin tabanlı CSRF,
     kontrollü logout, frontend credentials ve Bearer'dan geri uyumlu geçiş
     kodlandı, CI ve bayraklar kapalı canlı smoke geçti (Sprint 56). Bayraklar
     özel API domaini hazır olana kadar kapalıdır.
   - `api.dublajlab.com.tr` Railway'e bağlandı; DNS doğrulaması ve TLS geçti.
   - Vercel `VITE_API_BASE_URL`, CSP ve Google OAuth callback adresi özel API
     alan adına taşındı. Discord hesabındaki harici kısıt nedeniyle Discord OAuth
     production'da kontrollü biçimde kapalı bırakıldı.
   - `AUTH_SESSION_COOKIE_ENABLED=true` ve `AUTH_COOKIE_ONLY=true` canlıya alındı.
     Parola girişi, Google OAuth, `/me`, sayfa yenileme ve logout akışlarında
     HttpOnly cookie-only oturum canlıda doğrulandı; URL ve API yanıtında JWT yok.
   - Yenileme/rotasyon ayrı bir savunma-derinliği iyileştirmesi olarak izlenecek;
     mevcut kısa ömürlü JWT, parola değişiminde oturum iptali ve kontrollü logout
     canlı geçiş için kabul edildi.
3. **Production secret temizliği — SMTP temizliği tamamlandı (18 Ekim 2026)**
   - Resend aktifken kullanılmayan yedi `SMTP_*` değişkeni Railway production
     ortamından kaldırıldı; `EMAIL_DELIVERY_PROVIDER=resend` ve gerekli
     `RESEND_*` değişkenleri korundu.
   - Deploy sonrası özel API health endpoint'i HTTP 200 döndü. İzlenen dosyalarda
     gerçek `.env`, özel anahtar veya bilinen secret biçimi bulunmadı.
   - Kalan kontrollü iş: sağlayıcı anahtarlarını kesintisiz rotasyon planıyla
     yenile ve her anahtarın minimum yetkili olduğunu panelden doğrula.
4. **İzleme ve alarm**
   - Uygulama hata takibi, uptime kontrolü, Railway kaynak alarmı.
   - Canlı `/api/health` 18 Ekim kontrolünde `redis_configured:false` ve
     `redis_connected:false` döndü; Railway Redis bağlantısını yeniden kur.
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
