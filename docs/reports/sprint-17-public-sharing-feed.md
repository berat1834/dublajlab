# Faz 17: Public Sharing + Real Dubs Feed

## Amaç
Kullanıcıların kendi Kataloğum sayfasındaki tamamlanmış dublajlarını herkese açık (public) hale getirebilmesini sağlamak. Böylece ana menüdeki "Dublajlar" sayfasının, demo placeholder içeriklerden gerçek kullanıcı verisine (Public Feed) bağlanması.

## Gerçekleştirilen Geliştirmeler

### Backend Yapısı
1. **Veritabanı Alanları**: Mevcut `DubbingProject` modelinde yer alan `visibility` alanı ("private" veya "public") aktif hale getirildi.
2. **Yeni Route (`public_router.py`)**: 
   - `GET /api/public/dubs`: Herkese açık ve `status=completed` olan projeleri listeler. Çıktı dosyasının diskte (FileStorageService) mevcut olup olmadığını kontrol eder. Dosyası silinmiş olan projeler public feed'de listelenmez.
   - `GET /api/public/dubs/{project_id}`: Sadece herkese açık olan projenin detayını getirir.
3. **Güvenlik / Şema (`PublicDubResponse`)**: Listeleme cevaplarında kullanıcının mail veya hassas verileri kesinlikle döndürülmez, sadece `display_name` kullanılır.
4. **Visibility Güncellemesi**: Mevcut `PATCH /api/me/projects/{project_id}` endpoint'i üzerinden (`updateProjectVisibility` ile) kullanıcıların projelerini `public` <-> `private` yapabilmesi test edildi ve onaylandı.

### Frontend Yapısı
1. **UserLibrary (Kataloğum) Bileşeni**:
   - Her tamamlanmış (completed) projenin yanına bir toggle butonu (Açık/Gizli - Globe/Lock ikonlarıyla) eklendi.
   - Eğer dublaj dosyasının süresi dolmuşsa (indirme linki yoksa), bu toggle fonksiyonu çalıştırılamaz hale getirildi ve kullanıcı hatalı bir durumu public yapmaktan engellendi.
2. **ShowcaseDubs (Dublajlar) Bileşeni**:
   - Daha önce hardcoded statik kartlardan (Demo Dublaj #1, #2) oluşan sayfa, artık gerçek `/api/public/dubs` API'sine bağlandı.
   - Eğer veri tabanında hiç public dublaj yoksa veya API'ye erişilemezse mevcut dummy kartlar yedek (fallback) olarak, uyarı ("Canlı demo için örnek içerik...") gösterilerek ekrana basılmaktadır.

### Testler ve QA
- `test_public_dubs.py` adında yeni testler eklendi.
- Başka bir kullanıcının private projesinin public feed'e düşmediği veya değiştirilemediği `test_user_library.py` (Faz 16.5) ile birlikte tekrar doğrulandı.

## Riskler / Sınırlar
- **Moderasyon Eksikliği**: Gerçek kullanıcıların oluşturduğu içerikler şifresiz, anında herkese açık hale gelmektedir. Spam, zararlı metin (TTS kaynaklı) veya uygunsuz ses kayıtlarına karşı onay mekanizması henüz bulunmamaktadır.
- Sadece `display_name` kullanıldığı için platform içindeki kullanıcı taklitleri (impersonation) ihtimal dahilindedir.
