# Sprint 36: Lip-sync PR Hardening & Security Release Review

## 1. Amaç
- Açık kaynak (non-commercial) Wav2Lip modelinin `feat/real-wav2lip-integration` branch'i ile projeye eklenmesi öncesinde production (ticari) risklerini kapatmak.
- Lip-sync (Dudak Senkronizasyonu) özelliğini güvenli bir **feature flag (özellik bayrağı)** arkasına almak.
- PR'ın (Pull Request) main branch'e güvenli bir şekilde birleştirilmesini sağlamak.

## 2. Bağlam ve Kararlar
- **Lisans Kısıtlaması:** Wav2Lip açık kaynak ağırlıkları (weights), *yalnızca ticari olmayan (non-commercial)* kullanım iznine sahiptir. DublajLab VIP özelliklerinin ücretli aboneliklerle satılması planlandığı için bu motoru doğrudan production VIP kullanıcılarına sunmak telif ihlali doğurur.
- **Mimari Karar:** Gerçek model ağırlıkları ve kaynak dosyaları repodan izole edilmiştir. Production ortamında standart FastAPI/FFmpeg backend'i (Railway vb.) korunacak, dudak senkronizasyonu için gelecekte ya ticari lisanslı bir model (örn. SyncLabs API) kullanılacak ya da ayrı bir izole GPU worker (örn. Modal.com Serverless) çalıştırılacaktır.

## 3. Yapılan Değişiklikler

### Backend
- `backend/config.py` içerisine `LIPSYNC_ENABLED` (varsayılan: `False`) ortam değişkeni eklendi.
- `jobs_router` (`backend/routers/jobs.py`) içerisinde bulunan `enforce_lip_sync_vip` kontrol noktası güncellenerek özellik global olarak kapalıysa doğrudan `403 Forbidden ("Dudak senkronizasyonu (lip-sync) özelliği şu anda kullanıma kapalıdır.")` dönmesi sağlandı.
- Test dosyaları (`test_jobs_api.py`, `test_public_demo_api.py`) yeni feature flag mantığına göre (LIPSYNC_ENABLED=True mock'lanarak) uyarlandı.

### Frontend
- `/api/system/demo-policy` endpointine (ve TS arayüzlerine) `lipsync_enabled` özelliği eklendi.
- `App.tsx` içindeki "Dudak Senkronizasyonu" (Deneysel) toggle arayüzü, yalnız `demoPolicy.lipsync_enabled` `true` olduğunda görüntülenecek şekilde UI katmanında da gizlendi. 

## 4. Test Sonuçları ve Doğrulama
- 92 backend testi başarıyla yeşil (green) sonuçlandı (LIPSYNC_ENABLED=True simüle edilerek VIP kontrol akışları doğrulandı).
- Frontend bileşenleri başarıyla build edildi ve ESLint testlerinden (0 hata, 0 uyarı) geçti.
- Özellik `False` durumundayken dışarıdan hiçbir yolla tetiklenemediği ve arayüzde kafa karışıklığı yaratmadığı onaylandı.

## 5. Sonraki Adımlar ve Dağıtım Notları
- Bu branch, CI denetimleri tamamlandıktan sonra `main` branch'e merge edilebilir.
- Canlı sunucularda (production) `LIPSYNC_ENABLED` değişkeni açıkça belirtilmedikçe özellik default `False` olarak kilitli kalacaktır. 
- Gerçek ticari (commercial-friendly) bir API sağlayıcısı bulunduğunda bu flag `True` olarak güncellenip VIP kullanıcılara hizmet verebilir.
