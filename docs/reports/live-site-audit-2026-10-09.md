# DublajLab Canlı Site ve Yönetim Paneli Denetimi

Tarih: 9 Ekim 2026  
Canlı frontend: `https://www.dublajlab.com.tr`  
Canlı backend: `https://backend-production-c956d.up.railway.app`

## Kapsam ve yöntem

Bu denetimde canlı HTTP cevapları, yayınlanan frontend paketi, canlı OpenAPI sözleşmesi,
frontend ekran bileşenleri, backend router/service kodu ve mevcut testler incelendi.
Kullanıcının paylaştığı masaüstü ekran görüntüleri de görsel değerlendirmeye dahil edildi.

Tarayıcı otomasyon bağlantısı açık Chrome oturumunu göremediği için giriş gerektiren
ekranlarda gerçek kullanıcı adına tıklamalı test yapılamadı. Bu ekranlar kod, API ve
yetkilendirme seviyesinde incelendi. Silme, ödeme, moderasyon ve admin işlemleri canlı
veriye zarar vermemek için uygulanmadı.

## Doğrulanan iyi durumlar

- `dublajlab.com.tr`, `www.dublajlab.com.tr` adresine kalıcı olarak yönleniyor.
- `www` domaini HTTPS üzerinden `200 OK` dönüyor.
- Logo, favicon, Apple icon, sosyal paylaşım görseli ve manifest erişilebilir.
- Backend health, FFmpeg ve template liste endpointleri çalışıyor.
- Özel domain için backend CORS cevabı doğru.
- Admin endpointleri token olmadan `401` dönüyor; frontend gizlemesine güvenilmiyor.
- Free/VIP kontrolünün backend tarafında testleri bulunuyor.
- Google OAuth başlangıcı artık `return_to=https://www.dublajlab.com.tr` değerini
  allowlist kontrolünden geçirip `state` içinde taşıyor.
- Son `main` CI koşusu başarılı.

## Kritik ve yüksek öncelikli bulgular

### P0 — Hesap silme endpointi hatalı alan adına erişiyor

`backend/routers/user_router.py` içindeki hesap silme akışı
`current_user.hashed_password` kullanıyor. Gerçek model alanı `password_hash`.
Bu nedenle parola ile açılmış hesaplarda silme isteği sunucu hatasına düşebilir.
OAuth kullanıcılarının parola alanı boş olduğu için onların hesap silme yöntemi de ayrıca
tanımlı değil.

Öneri:

- Alan adını `password_hash` olarak düzelt.
- Parola hesabı ve OAuth hesabı için ayrı, testli sahiplik doğrulaması ekle.
- `DELETE /api/me/account` için başarılı, yanlış parola ve OAuth kullanıcı testleri ekle.

### P0 — Hazır sahne kataloğundaki tüm demo video yolları canlıda 404

Aşağıdaki metadata yollarının tamamı canlı backend üzerinde `404` dönüyor:

- `/templates/ofis-surprizi.mp4`
- `/templates/uzay-gorevi.mp4`
- `/templates/comedy-reaction.mp4`
- `/templates/dramatic-line.mp4`
- `/templates/product-demo.mp4`

Katalog kartları ürünün ana CTA'larından biri olduğu için kullanıcı “Dublaj yap” dediğinde
akış kesiliyor. Metadata ile gerçek medya durumu birbiriyle uyumlu değil.

Öneri:

- Telifsiz/üretilmiş medya R2'ye yüklenene kadar kartları açık biçimde “önizleme/demo
  metadata” olarak işaretle ve export CTA'sını devre dışı bırak.
- Alternatif olarak güvenli demo medyayı R2'ye ekleyip metadata URL'lerini gerçek public
  URL ile güncelle.
- CI veya smoke testte template `video_url` için `HEAD/GET 200` kontrolü ekle.

### P0 — Google OAuth güvenlik state değeri yalnızca dönüş origin'i olarak kullanılıyor

OAuth `state` alanında canonical dönüş origin'i taşınıyor; ancak kullanıcı oturumuna bağlı,
tek kullanımlık kriptografik nonce görünmüyor. Allowlist açık yönlendirmeyi engellese de
standart OAuth CSRF/login-CSRF korumasının yerini tutmaz.

Öneri:

- `state` içine kısa ömürlü, imzalı nonce ve allowlistli return origin koy.
- Callback'te nonce'ı doğrula ve tek kullanımlık tüket.
- Uzun vadede access token'ı URL query ve `localStorage` yerine `HttpOnly`, `Secure`,
  `SameSite=Lax` cookie ile taşı.

### P1 — Bazı ürün ekranları işlevselmiş gibi görünen statik maketler

`OdaKur`, `UserCredits`, `PublicProfile` ve `UserScenes` ekranlarında gerçek veriye bağlı
olmayan sayılar, tarihler, XP, kredi ve butonlar bulunuyor. Özellikle:

- “Odayı kur”, “Yeni oda”, “VIP'e geç” ve “Sahne aktar” butonlarının bir kısmında handler yok.
- Kredi bakiyesi `35`, işlem tarihi ve yenilenme tarihi statik.
- Profil istatistikleri ve katılım tarihi statik.
- Sahne oluşturma akışı gerçek form yerine `mailto:` bağlantısına gidiyor.
- Oda/multiplayer için backend API bulunmuyor.

Bu durum portföy demosunda kabul edilebilir; canlı ürün ekranında kullanıcıya yanıltıcı gelir.

Öneri:

- Hazır olmayan ekranlara görünür “Tasarım önizlemesi / yakında” rozeti koy.
- İşlevsiz CTA'ları kaldır veya disabled yap.
- MVP oda/kredi kapsam dışıysa navbar ve footer'dan geçici olarak gizle.

### P1 — Profil ayarları kaydedilmiş gibi davranıyor fakat backend'e yazılmıyor

`AccountSettings.handleSaveProfile` yalnızca React state içindeki kullanıcı nesnesini
değiştiriyor ve başarı mesajı gösteriyor. Bio, gizlilik ve avatar değişiklikleri için gerçek
update endpointi yok. Sayfa yenilenince veriler kaybolabilir.

Öneri:

- Ya gerçek `PATCH /api/me` endpointi ve validasyon ekle ya da bu kontrolleri “yakında”
  durumuna al.
- Başarı toast'ı yalnızca backend başarılı olduktan sonra gösterilsin.

### P1 — İngilizce dil seçeneği hâlâ tüm ekranları kapsamıyor

Ana landing/stüdyo akışı büyük ölçüde çevrilmiş olsa da aşağıdaki alanlarda sabit Türkçe
metinler bulunuyor:

- `OdaKur`
- `SceneDetail`
- `AccountSettings` içindeki bazı başlık ve butonlar
- `AdminModerationPanel` ve `AdminOpsPanel` içindeki bazı kolonlar/başlıklar
- `UserLibrary`, `UserCredits`, `PublicProfile`, `UserScenes`
- bazı tarih formatları zorla `tr-TR`

Öneri:

- JSX içindeki kullanıcıya dönük literal metinleri engelleyen basit lint/test yaklaşımı ekle.
- Tarih biçimini seçili dile göre `tr-TR` / `en-US` üret.
- TR ve EN için ekran bazlı smoke checklist oluştur.

### P1 — Ürün vaatleri ile gerçek backend politikası arasında tutarsızlık riski

Canlı backend şu değerleri bildiriyor:

- Free export: `720p`
- Public demo video süresi: `30 saniye`
- Günlük export: `5`
- Medya TTL: `6 saat`
- Lip-sync: kapalı

Bazı yeni/pending UI metinlerinde `480p`, `3 dakika`, `10 dakika`, sınırsız export,
kalıcı depolama, VIP+ ve aktif LipSync gibi henüz backend tarafından sağlanmayan vaatler
bulunuyor. Bunlar deploy edilirse yanlış ürün vaadine dönüşür.

Öneri:

- Plan özelliklerini frontend sabitlerinden değil `/api/membership/plans` ve
  `/api/system/demo-policy` cevaplarından üret.
- Uygulanmayan VIP+, oda, kredi, öncelikli kuyruk ve kalıcı depolama vaatlerini kaldır.

## Yönetim paneli değerlendirmesi

### Mevcut olanlar

Projede iki ayrı admin ekranı gerçekten var:

1. `AdminModerationPanel`
   - içerik raporlarını listeliyor;
   - raporu reddedebiliyor;
   - projeyi gizleyip raporu `action_taken` yapabiliyor.

2. `AdminOpsPanel`
   - veritabanı, Redis, FFmpeg, storage, Shopier ve lip-sync durumunu gösteriyor;
   - kullanıcı, VIP, export, paylaşım, ödeme, yorum ve rapor sayılarını gösteriyor;
   - yakın zamandaki başarısız projeleri listeliyor.

Backend tarafında ayrıca şu admin endpointleri var:

- `PATCH /api/admin/users/{user_id}/membership`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/{report_id}`
- `PATCH /api/admin/projects/{project_id}/moderation`
- `PATCH /api/admin/comments/{comment_id}/hide`
- `GET /api/admin/ops/metrics`

Tüm bu endpointler `current_user.role == "admin"` kontrolü kullanıyor. Canlıda oturumsuz
`reports` ve `ops/metrics` istekleri `401` döndü.

### Eksikler ve riskler

- Kullanıcı listesi/arama ekranı yok.
- Backend'de VIP tanımlama endpointi olmasına rağmen frontend admin arayüzü yok.
- Yorum gizleme endpointi var fakat moderasyon ekranında yorum yönetimi yok.
- Rapor listesinde pending-first sıralama amaçlanmış ancak kod ikinci sorguyla bunu eziyor.
- Rapor `status` ve proje `moderation_status` parametreleri enum ile sınırlandırılmıyor;
  admin yanlış/uydurma değer gönderebilir.
- Admin işlemleri için ayrı audit log tablosu yok.
- Ops panelinde manuel yenileme, periyodik refresh ve zaman damgası yok.
- Redis bağlantı hatası yutuluyor; panel yalnızca kırmızı/yeşil durum gösteriyor, hata nedeni yok.
- Admin rolü `ADMIN_EMAILS` üzerinden yalnız klasik login sırasında veriliyor. Google OAuth ile
  giriş yapan aynı e-posta admin olmayabilir. Ayrıca env listesinden çıkarılan mevcut adminin
  rolü otomatik geri alınmıyor.

Önerilen minimum admin sprinti:

1. Admin rol eşlemesini klasik login ve OAuth için ortak servise taşı.
2. Kullanıcı arama + süreli VIP aç/kapat ekranı ekle.
3. Rapor ve moderation durumlarını enum ile doğrula.
4. Yorum moderasyonunu ekrana bağla.
5. Admin action audit log ekle.
6. Ops paneline “son güncelleme”, manuel refresh ve güvenli hata özeti ekle.

## Orta öncelikli bulgular

### P2 — SPA ekranlarının URL'si yok

Navbar sekmeleri yalnızca React state değiştiriyor. Sahne, üyelik, katalog ve admin ekranları
ayrı route üretmiyor. Sonuçları:

- tarayıcı geri/ileri düğmesi beklenen şekilde çalışmaz;
- sayfa yenilenince kullanıcı ana ekrana döner;
- admin veya sahne detayına doğrudan link verilemez;
- analytics ve hata ayıklama zorlaşır.

Öneri: Küçük bir router yapısı veya en azından History API ile stabil path'ler ekle.

### P2 — Güvenlik header seti eksik

Frontend cevabında HSTS var; ancak gözlenen cevapta CSP, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy` ve clickjacking koruması görünmüyor.

Öneri: Vercel header konfigürasyonunda önce report-only CSP ile başlayıp gerekli güvenlik
header'larını ekle. Mikrofon için Permissions Policy bilinçli tanımlanmalı.

### P2 — OAuth token query string ve localStorage kullanıyor

Callback JWT'yi `?token=` ile frontend'e gönderiyor; frontend token'ı `localStorage` içine
yazıp URL'yi temizliyor. Temizleme iyi olsa da query string log/history riskini tamamen
ortadan kaldırmaz ve `localStorage` XSS etkisini büyütür.

Öneri: HttpOnly cookie tabanlı oturuma geçişi ayrı güvenlik sprintine al.

### P2 — Auth endpointlerinde özel brute-force limiti görünmüyor

Public demo export için rate limit var; login/register için ayrı IP + hesap tabanlı limit
görünmüyor.

Öneri: Başarısız login denemelerine kısa pencere limiti ve artan bekleme ekle.

### P2 — İletişim alan adları tutarsız

Kodda `hello@dublajlab.com`, `destek@dublajlab.com`, `sales@dublajlab.com` ve
`iletisim@dublajlab.com` adresleri kullanılıyor; canlı ana domain `.com.tr`.

Öneri: Gerçekten çalışan tek bir `.com.tr` iletişim adresi belirle ve tüm ekranlarda aynı
adresi kullan. Çalışmayan mailto bağlantılarını yayınlama.

### P2 — Telif mesajı bazı ekranlarda ürün politikasına ters düşüyor

`UserScenes` kullanıcıya “film ya da dizi sahnesi yükle” diyor. Projenin diğer alanları
telifli içerik yüklememeyi söylüyor.

Öneri: Metni “haklarına sahip olduğun veya açık lisanslı video” olarak değiştir; kaynak ve
lisans alanlarını zorunlu kıl.

### P2 — Ödeme akışı tamamlanmış ürün gibi sunulabilir

Checkout endpointi pending ödeme kaydı oluşturuyor; yorumlarda gerçek Shopier form/redirect
entegrasyonunun tam olmadığı belirtilmiş. UI ödeme bağlantısı yoksa yalnız sipariş ID'si
gösteriyor.

Öneri: Provider gerçekten aktif değilken CTA'yı “ödeme yakında” olarak göster ve gereksiz
pending ödeme kaydı üretme. Canlı ödeme açılmadan webhook doğrulamasını sağlayıcı dokümanıyla
yeniden test et.

## Düşük öncelikli UX ve erişilebilirlik bulguları

- Bazı icon-only admin/moderasyon butonlarında `aria-label` yerine yalnız `title` var.
- Mobilde üç adım göstergesi son değişiklikle dikeyleşiyor; metin yüksekliği ve ilk ekran
  kapladığı alan gerçek cihazda kontrol edilmeli.
- Boş topluluk feed'i teknik olarak doğru fakat kullanıcıya güçlü bir başlangıç CTA'sı vermeli.
- Statik “Günün Dublajı” ekranı gerçek içerikmiş gibi algılanmamalı; demo etiketi korunmalı.
- Profilde sabit katılım tarihi ve seviye metni gerçek kullanıcı verisiyle değiştirilmelidir.
- Admin tabloları mobilde yatay kayıyor; kritik aksiyon kolonunun sticky olması yararlı olur.
- `SecurityCheck` içindeki “Bot koruması atlatılıyor” ifadesi güven vermiyor; “Güvenlik
  kontrolü yapılıyor” gibi tarafsız bir ifade kullanılmalı.

## Önerilen uygulama sırası

1. Hesap silme endpointi ve OAuth hesap silme davranışı.
2. Template 404 problemi: gerçek telifsiz medya veya doğru disabled demo durumu.
3. OAuth nonce/cookie güvenliği ve admin rolünün OAuth ile eşlenmesi.
4. İşlevsiz oda/kredi/profil/sahne CTA'larının gizlenmesi veya açık demo etiketi.
5. TR/EN kapsamının tamamlanması ve backend politika değerlerinden dinamik UI.
6. Admin kullanıcı/VIP yönetimi, durum enumları ve audit log.
7. SPA route yapısı, güvenlik header'ları ve auth rate limit.
8. Mobil/erişilebilirlik son QA.

## Manuel doğrulama gerektirenler

- Google login'i yeni bir gizli sekmede başlatıp dönüşün `www.dublajlab.com.tr` üzerinde
  kaldığını doğrulama.
- Admin e-posta ile Google OAuth girişinden sonra admin menülerinin görünüp görünmediği.
- Gerçek mikrofon kaydı + export + kütüphane indirme akışı.
- Gerçek admin hesabıyla rapor kapatma ve proje gizleme.
- Gerçek Shopier sandbox/callback akışı.
- 375 px genişlikte mobil navbar, kayıt timeline ve export sonuç ekranı.

