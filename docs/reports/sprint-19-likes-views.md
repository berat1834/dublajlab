# Faz 19: Likes + View Counts for Public Dubs

## Amaç
Public Dublajlar (ShowcaseDubs) feed’ine temel etkileşim metriklerini (görüntülenme ve beğeni) entegre etmek.

## Gerçekleştirilen Geliştirmeler

### Backend
1. **Veritabanı Modelleri**:
   - `DubbingProject` modeline `view_count` eklendi.
   - Beğenileri tutmak için `DubbingLike` modeli oluşturuldu ve aynı kullanıcının bir projeyi birden çok kez beğenmesini engelleyen `UniqueConstraint` eklendi.
2. **API Uç Noktaları**:
   - `POST /api/public/dubs/{project_id}/like`: Projeyi beğenir (Giriş zorunlu).
   - `DELETE /api/public/dubs/{project_id}/like`: Beğeniyi geri alır (Giriş zorunlu).
   - `POST /api/public/dubs/{project_id}/view`: Görüntülenme sayısını artırır (Giriş zorunlu değil).
3. **Veri Dönüşü**:
   - `GET /api/public/dubs` çağrılarında artık her proje için `like_count`, `view_count` ve o anki kullanıcının beğenip beğenmediğini gösteren `liked_by_me` alanı dönmektedir.

### Frontend
1. **API Entegrasyonu**:
   - `toggleLikePublicDub` ve `recordViewPublicDub` fonksiyonları `lib/api.ts` içerisine eklendi.
2. **UI Güncellemeleri (`ShowcaseDubs.tsx`)**:
   - Kartların sağ alt köşesindeki statik ikonlar yerine, veritabanından dönen dinamik izlenme ve beğeni ikonları konuldu.
   - Oynat (Play) tuşuna basıldığında (video izleme simülasyonu tetiklendiğinde) view_count artar.
   - Kalp ikonuna basıldığında Optimistic UI mantığıyla beğeni butonu kırmızı olur veya geri alınır; arka planda API isteği çalışır.

## Testler
- Backend için `test_likes.py` yazılarak, login olan/olmayan kullanıcı senaryoları, idempotent beğeni, ve unique kısıtlamaları test edildi ve onaylandı.
- Frontend lint ve derleme sorunsuz geçti.

## Bilinen Limitasyonlar
- İzlenme (View) özelliği basit tutulmuştur (aynı IP kısıtlaması, cookie kontrolü vs. yoktur). Refresh ettikçe veya tekrar izlendikçe view count manipüle edilebilir. (MVP aşaması için uygundur).
