# Faz 41: Shopier Webhook & VIP Aktivasyonu

## 🎯 Amaç
DublajLab'in MVP sonrası gelir modeli olan "Stüdyo VIP" erişimi için Türkiye odaklı ödeme altyapısı **Shopier** entegrasyonu tamamlandı. Ödemelerin tamamen backend kontrollü ve sahteciliğe kapalı (imza doğrulamalı) yapılması sağlandı.

## 🛠️ Yapılanlar
1. **Veritabanı (SQLAlchemy + Alembic)**:
   - `Payment` modeli eklendi (status, amount, currency, raw_event vs.).
   - Migration (`654f38a3fb19_add_payments_table`) çalıştırılarak SQLite/PostgreSQL uyumlu hale getirildi.

2. **Backend (FastAPI)**:
   - `/api/payments/checkout`: Oturum açan kullanıcının seçtiği plan için (ör: monthly) "pending" durumunda Payment kaydı oluşturur.
   - `/api/payments/webhook`: Shopier'in callback adresi olarak hizmet verir. Gelen payload (sipariş no, durum) ve Shopier'in özel imzası (res_signature) `HMAC-SHA256` ile doğrulanır.
   - Doğrulama başarılıysa ve durum "success" ise ilgili kullanıcıya anında 30 günlük "vip" yetkisi (has_active_vip) verilir.
   - Duplike webhook tetiklenmelerine karşı Idempotency (önceden "paid" ise işlem yapmadan 200 OK dönme) uygulandı.

3. **Frontend (React)**:
   - `Membership.tsx` içerisindeki "VIP Ol" butonu doğrudan dışarıya yönlendirmek yerine, önce yetkili bir çağrıyla `/api/payments/checkout` endpoint'ine vurur.
   - Sistem kapalıysa veya hata alınırsa Toast mesajı ile kullanıcı bilgilendirilir.
   - VIP ekranındaki mesajlar (aktif olup olmadığı) frontend'in `currentUser` statelerine tam bağlandı.

4. **Güvenlik & Test (Pytest)**:
   - `SHOPIER_ENABLED` bayrağı ile istenildiği zaman production ortamında yeni ödemeler durdurulabilir (Fail-Safe).
   - Shopier Secret / API Key değerleri `.env` üzerinden okunacak şekilde yapılandırıldı, kod içine statik anahtar gömülmedi.
   - Webhook üzerinden izinsiz VIP atanmasını engelleyen ve hatalı imzada 400 Bad Request fırlatan kapsamlı unit testler `backend/tests/test_payments_api.py` içerisinde yazıldı (Test Skoru: 7/7).

## 🚀 Sonuç
Shopier altyapısı production seviyesinde canlıya alınmaya hazır hale geldi. Sadece Railway (production ortamı) tarafında `SHOPIER_API_KEY` ve `SHOPIER_CALLBACK_SECRET` Environment Variable değerlerinin doldurulması, ardından Shopier paneli üzerinden geri dönüş (webhook) URL'inin ayarlanması yeterli olacaktır.
