# Sprint 47: Safe Demo Video Pack + Showcase Seed Content

## Kapsam
DublajLab'in boş görünmemesi ve telif hakkı ihlali riski taşıyan gerçek dünya videoları yerine; tamamı FFmpeg ile üretilmiş "Synthetic" (sentetik/üretilmiş) şablon videoların sisteme dahil edilmesi.

## Yapılan İşlemler
1. **FFmpeg Sentetik Videolar (backend/frontend):**
   - 5 adet kısa demo video (8-12 sn, 720p, H.264, düşük bitrate) FFmpeg test paternleri (testsrc, mandelbrot vb.) kullanılarak tamamen projeye özgü bir biçimde sıfırdan oluşturuldu.
   - Videolar `frontend/public/templates/` dizinine yerleştirilerek doğrudan CDN üzerinden sunulması kolaylaştırıldı.
2. **Metadata ve Veritabanı:**
   - `backend/data/templates/templates.json` dosyası yeni videoların adreslerini (`video_url`) alacak şekilde güncellendi.
   - Tüm şablonlara açıkça `is_demo: true` alanı eklendi.
   - Lisans metinleri `CC0 / Generated synthetic demo` olarak güncellendi.
   - `VideoTemplate` backend veri şeması (Pydantic ve frontend Types) `is_demo` (bool) destekleyecek biçimde genişletildi.
3. **UI ve Public Fallback (Frontend):**
   - **TemplateGallery.tsx:** Hazır sahnelerin köşesine `Demo` etiketi eklendi.
   - **ShowcaseDubs.tsx:** Eğer gerçek kullanıcı dublajı yoksa gösterilen "boş gri ekran" kartlarının sağ üstüne açıkça belirgin "Demo" etiketi konuldu.
   - **DailyDub.tsx:** Günün dublajı fallback içeriğinin sağ üst köşesine "Demo İçerik" etiketi iliştirildi.
4. **Hukuki Teminat (Legal Safe):**
   - Projenin hiçbir aşamasında telif hakkı ihlali içerebilecek bir video (dizi, film, TikTok) kullanılmamaktadır. Sistemdeki tüm görseller projeye özel ve "Demo" etiketi ile sunulmaktadır.

## Test Durumu
- `npm run lint` / `npm audit` / `npm run build`: Hata yok.
- `backend/tests`: Testler başarılı.
- UI Test: Fallback ve "Demo" etiketleri sorunsuz çalışıyor.
