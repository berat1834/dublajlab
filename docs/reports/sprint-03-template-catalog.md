# Üçüncü Sprint — Hazır Video / Template Sistemi

## Özet

Faz 3 kapsamında telifli medya eklemeden JSON tabanlı hazır sahne kataloğu, doğrulama modelleri, API endpoint'leri ve frontend template seçimi eklendi. Template videosu bulunmadığında kullanıcı replik metinlerini düzenleyebilir ve mikrofon kayıt akışını deneyebilir; neden preview/export alınamadığı açıkça gösterilir. İleride açık lisanslı bir `video_url` eklendiğinde dosya mevcut upload endpoint'ine aktarılır ve var olan FFmpeg hattı kullanılır.

## Backend Değişiklikleri

- `VideoTemplate` modeli ve zorunlu lisans/kaynak alanları eklendi.
- Replik sayısı, benzersiz kimlik, başlangıç/bitiş ve video süresi validasyonları eklendi.
- `backend/data/templates/templates.json` içinde videosuz iki güvenli metadata örneği oluşturuldu.
- `TemplateService` ile JSON okuma ve Pydantic doğrulama katmanı eklendi.
- `GET /api/templates` ve `GET /api/templates/{template_id}` endpoint'leri eklendi.
- Bilinmeyen template kimliği için Türkçe `404` yanıtı eklendi.
- Liste, detay, 404 ve sekiz geçersiz metadata senaryosu için testler eklendi.

## Frontend Değişiklikleri

- Kaynak bölümüne “Kendi videonu yükle” ve “Hazır sahne seç” seçenekleri eklendi.
- Template kartlarında kategori, süre, replik sayısı, lisans ve kaynak bilgisi gösterildi.
- `fetchTemplates` ve `fetchTemplate` API istemcileri eklendi.
- Seçilen template replikleri düzenlenebilir TimelineRecorder başlangıç verisi haline getirildi.
- Medya dosyası olmayan template için güvenli boş preview ve export açıklaması eklendi.
- `video_url` eklendiğinde template videosunu mevcut upload akışına aktaran altyapı hazırlandı.
- Mevcut kullanıcı upload, mikrofon kayıt, AI ses ve export akışları korunmuştur.

## Değişen / Eklenen Dosyalar

- `backend/models.py`
- `backend/services/template_service.py`
- `backend/routers/templates.py`
- `backend/data/templates/templates.json`
- `backend/main.py`
- `backend/tests/test_templates_api.py`
- `frontend/src/types.ts`
- `frontend/src/lib/api.ts`
- `frontend/src/components/TemplateGallery.tsx`
- `frontend/src/components/TimelineRecorder.tsx`
- `frontend/src/App.tsx`
- `.gitignore`, `README.md`, `RAPOR.md`

## Kapsam Dışı Bırakılanlar

- Telifli veya lisansı doğrulanmamış medya
- Gerçek demo video paketi
- Job queue, auth ve ödeme
- Backend işleme mimarisinde refactor

## Test Sonuçları

- Backend Pytest: 34/34 geçti (gerçek FFmpeg entegrasyon testi dahil)
- Frontend ESLint: geçti
- TypeScript + Vite production build: geçti
