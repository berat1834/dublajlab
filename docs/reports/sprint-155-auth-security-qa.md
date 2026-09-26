# Sprint 15.5: Auth Security & Persistence QA

**Hedef:** Faz 15 ile eklenen JWT Auth ve Veritabanı altyapısının test izolasyonunu sağlamak, güvenlik açıklarını kapatmak ve uygulamayı production standardına yaklaştırmak.

## Neler Yapıldı?
1. **Veritabanı Test İzolasyonu:**
   - Önceden backend testleri (`test_auth.py`) doğrudan geliştirme ortamındaki `dublajlab.db` (SQLite) dosyasına yazıyordu. Bu, her test koşusunda mevcut kullanıcı ve veritabanı verilerinin silinmesi riskini taşıyordu.
   - `test_auth.py` güncellenerek yalnızca test sürecinde yaşayacak olan bellek içi (`sqlite:///:memory:`) veritabanı kullanımına geçirildi.
2. **Case-Insensitive Kimlik Doğrulama:**
   - Yeni kayıt (`register`) ve giriş (`login`) yaparken email adreslerinin büyük/küçük harf duyarlılığı kapatıldı. Artık tüm veriler `email_lower = user.email.lower()` ile kaydediliyor ve eşleştiriliyor, böylece email çakışmaları ve erişim hataları önlendi.
3. **JWT ve Environment Güvenliği:**
   - JWT Secret Key, production ortamı için zorunlu kılındı. Eğer `ENVIRONMENT=production` olarak çalıştırılırsa ve `SECRET_KEY` env üzerinden sağlanmazsa (varsayılan "demo-super-secret..." keyi ile devam ediliyorsa) uygulamanın başlaması engellendi (`RuntimeError`).
   - Hem Frontend hem de Backend konfigürasyonlarını açıkça belgelemek için `.env.example` oluşturuldu.
4. **Token Testleri Genişletildi:**
   - Sadece pozitif (login/register başarılı) senaryoları değil; `test_me_without_token` (Token yokken erişim) ve `test_me_invalid_token` (Geçersiz token ile erişim) gibi JWT doğrulama (401 Unauthorized) testleri eklendi.
5. **Dokümantasyon:**
   - README güncellenerek localStorage içerisinde JWT tutulmasının getirebileceği XSS/Güvenlik riskleri netleştirildi ve Production'da HTTPS kullanımının **zorunlu** olduğu belirtildi.

## Sonuç
Gerçek Auth temelimiz, daha test edilebilir, daha güvenli ve tutarlı hale geldi. Mevcut public demo ve upload/export yapısı bozulmadan korunurken, "production-ready" bir kimlik temeline bir adım daha yaklaşılmış oldu.
