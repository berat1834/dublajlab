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
- `backend/config.py` içerisinde `LIPSYNC_ENABLED` varsayılanı `False`, `LIPSYNC_PROVIDER` varsayılanı `disabled` olarak tanımlandı.
- Provider değerleri `disabled`, `local`, `modal` ve `api` ile sınırlandı. Hazır olmayan remote adaptörler sahte çıktı üretmek yerine fail-closed davranır.
- `APP_ENV=production` + `LIPSYNC_PROVIDER=local` kombinasyonu açık modelin ticari lisans riski nedeniyle backend tarafından reddedilir.
- `jobs_router` içindeki kontrol noktası global özellik/provider kullanılamıyorsa Türkçe `503`, aktif VIP yetkisi yoksa Türkçe `403` döndürür.
- Docker Compose ve örnek env dosyalarına güvenli `false`/`disabled` varsayılanları eklendi.

### Frontend
- `/api/system/demo-policy` endpoint'indeki `lipsync_enabled`, yalnız flag ve hazır provider birlikte uygunsa `true` döner.
- `App.tsx` içindeki toggle yalnız backend capability değeri `true` olduğunda görüntülenir; capability kapanırsa seçili state de temizlenir.
- Görünürlük kararı saf fonksiyona ayrıldı ve frontend birim testi eklendi.

## 4. Test Sonuçları ve Doğrulama
- Backend pytest: 97/97 geçti.
- Frontend Vitest: 7/7 geçti.
- Frontend ESLint ve TypeScript/Vite production build geçti.
- Flag kapalı normal export, Free/VIP erişim reddi, production local-provider kilidi, eksik model job hatası ve UI gizleme senaryoları doğrulandı.

## 5. Sonraki Adımlar ve Dağıtım Notları
- Bu branch, CI denetimleri tamamlandıktan sonra `main` branch'e merge edilebilir.
- Canlı sunucularda (production) `LIPSYNC_ENABLED` değişkeni açıkça belirtilmedikçe özellik default `False` olarak kilitli kalacaktır. 
- Gerçek ticari sağlayıcı adaptörü ve çıktı sözleşmesi uygulanıp test edilmeden bu flag production'da açılmamalıdır.

## 6. PR ve CI Sonucu

- PR [#12](https://github.com/berat1834/dublajlab/pull/12) açıldı.
- PR CI çalışmasında `Backend tests` ve `Frontend quality` job'ları başarılı oldu.
- PR, CI yeşil olduktan sonra `main` branch'ine merge edildi.
- Merge commit: `3ae6836446cbb9084d869ec348692fd3186fe01b`.
- Merge sonrası `main` CI çalışmasında backend ve frontend job'ları tekrar başarılı oldu.
- Production ayarı `LIPSYNC_ENABLED=false` ve `LIPSYNC_PROVIDER=disabled` olarak kalmalıdır.
