# Faz 20: Comments for Public Dubs

## Amaç
Kullanıcıların "Public" hale gelmiş projelere ("Dublajlar" sayfasındaki içeriklere) temel metin (plain text) yorumlar yazabilmesi. Zengin metin, mention veya tepki özellikleri olmaksızın, güvenlik odaklı MVP düzeyinde bir yorum sistemi kurmak.

## Gerçekleştirilen Geliştirmeler

### Backend Yapısı
1. **Veritabanı Modeli**: 
   - `DubbingComment` adında yeni bir SQLAlchemy modeli oluşturuldu. (id, project_id, user_id, body, status, created_at, hidden_at, hidden_by).
   - Alembic ile (`alembic upgrade head`) `dubbing_comments` tablosu oluşturuldu.
2. **Yorum Uç Noktaları (`public_router.py`)**:
   - `GET /api/public/dubs/{project_id}/comments`: Yalnızca `status="visible"` olan yorumlar çekilir.
   - `POST /api/public/dubs/{project_id}/comments`: Yalnızca giriş yapanlar (1-500 karakter sınırıyla) yorum gönderebilir. HTML engellemesi (zaten düz metin saklanıp react tarafından kaçılarak renderlanacak)
   - `DELETE /api/public/dubs/{project_id}/comments/{comment_id}`: Kullanıcı kendi yorumunu sildiğinde (status="hidden") olur, db'den kalıcı silinmez.
3. **Admin Moderasyon (`admin_router.py`)**:
   - `PATCH /api/admin/comments/{comment_id}/hide`: Admin yetkili kullanıcıların yorumları `hidden` yapabilmesini sağlar.

### Frontend Yapısı
1. **Component**: `PublicDubComments.tsx` 
   - Public projelere özel bir modal (popup) biçiminde yorum bölümü inşa edildi. 
   - Scrollable, yükleme durumu olan ve modern bir mesajlaşma deneyimi (ör. "Yorum yazmak için giriş yapın") sunan yapıda tasarlandı.
2. **Bağlantı**: 
   - `ShowcaseDubs.tsx` içindeki kalp (like) ikonunun yanına `Yorumlar` (MessageSquare) butonu eklendi, tıklandığında popup açılır.

## Testler
- **Backend**: `test_comments.py` dosyası ile yetkisiz yorum atma, boş yorum atma, kendi yorumunu silme ve Admin'in başkasının yorumunu silme senaryoları doğrulandı (Pass: %100).

## Riskler ve Sınırlar
- **Yorum Raporlama**: Şu an yorumlar için spesifik bir "kullanıcı şikayeti" butonu eklenmedi. Eğer bir yorum rahatsız ediciyse Admin DB/Endpoint üzerinden müdahale edebilir veya kullanıcı tüm projeyi raporlayabilir.
- **Basic Comment Moderation**: Otomatik bir toxicity (küfür vs.) filtreleme sistemi konulmadı. "No automated toxicity filtering" kuralı devrededir. Kullanıcılar ne yazarsa o çıkar. (Sadece düz metin render'ı yapıldığı için XSS koruması mevcuttur).
