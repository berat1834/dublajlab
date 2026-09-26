# Faz 16: Persistent User Dubbing Library (Kalıcı Kullanıcı Dublaj Kataloğu)

## Amaç
Kayıtlı kullanıcıların oluşturdukları tüm dublaj projelerini ve dışa aktarımlarını (export) kalıcı olarak görebilecekleri, indirebilecekleri ve silebilecekleri bir "Kataloğum" sayfası oluşturmak. Bu sayede uygulamanın geçici (ephemeral) yapısı, kayıtlı kullanıcılar için kalıcı ve yönetilebilir bir hale getirilmiştir.

## Yapılan Geliştirmeler

### Backend
1. **Veritabanı Modelleri (`models_db.py`):**
   - `DubbingProject`: Kullanıcının başlattığı dublaj sürecini (AI veya Kayıt) temsil eden tablo. (Süre, statü, başlık vb.)
   - `DubbingExport`: Tamamlanan projenin çıktı dosyası (MP4 download URL) bilgisini tutan tablo.
2. **Alembic Migration:**
   - Yeni tablolar için `alembic revision --autogenerate` ile taşıma scripti oluşturuldu ve `alembic upgrade head` ile veritabanına uygulandı.
3. **API Endpoints (`user_router.py`):**
   - `GET /api/me/projects`: Kullanıcıya ait projeleri listeler.
   - `GET /api/me/exports`: Kullanıcıya ait export çıktılarını listeler.
   - `DELETE /api/me/projects/{project_id}`: Projeyi ve bağlı export kayıtlarını siler.
4. **Job Entegrasyonu (`jobs.py`):**
   - AI ve Ses Kaydı oluşturma işlemlerinde (Job), isteği yapan `current_user` mevcutsa bir `DubbingProject` kaydı (`processing` durumunda) oluşturulur.
   - Background görevleri (task) işlerini bitirdiğinde (ya da hata aldığında) `run_ai_job_with_db` ve `run_recording_job_with_db` sarmalayıcı (wrapper) fonksiyonları ile DB kaydı güncellenerek tamamlandı/hata olarak işaretlenir. Başarılı ise `DubbingExport` kaydı oluşturulur.

### Frontend
1. **API Servisleri (`api.ts` & `types.ts`):**
   - Yeni veri tipleri (`DubbingProject`, `DubbingExport`) `types.ts` içerisine eklendi.
   - Kataloğum sayfasına özel veri çekme ve silme fonksiyonları `api.ts`'e eklendi.
2. **Kataloğum Sayfası (`UserLibrary.tsx`):**
   - Kullanıcının projelerini tarihe göre sıralayarak listeler. İşlenmekte (Processing) olanları, tamamlananları (İndir butonu ile) ve hatalı projeleri görsel geri bildirimlerle gösterir.
3. **Navbar ve Yönlendirme (`App.tsx` & `PlatformNavbar.tsx`):**
   - Kullanıcı giriş yaptığında Masaüstü ve Mobil menüde yeni "Kataloğum" sekmesi gösterilir.
   - Proje başarıyla export edildiğinde `App.tsx` içindeki "Dublaj videosu hazır" geri bildirimine ek olarak, kayıtlı kullanıcılara "Dublajın hesabına kaydedildi" mesajı (toast) gösterilir.

## Sonuç
DublajLab artık sadece tek seferlik (stateless) bir demo olmaktan çıkıp, hesap tabanlı kalıcı içerik yönetimini destekleyen bir platform mimarisine (MVP seviyesinde) ulaşmıştır. Demo akışı, anonim (giriş yapmamış) kullanıcılar için hala sorunsuz şekilde çalışmaktadır.
