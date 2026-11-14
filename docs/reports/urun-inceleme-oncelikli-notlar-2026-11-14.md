# DublajLab — Ürün İncelemesi ve Öncelikli Notlar

**İnceleme tarihi:** 14 Kasım 2026
**Kapsam:** Production web arayüzü, başlıca anonim kullanıcı akışları, mobil
görünüm, ilgili kaynak kodu, GitHub CI ve son sprint raporları.
**Sınır:** Gerçek hesap oluşturma/girişi, video yükleme ve export, yorum/beğeni,
ödeme veya yönetici işlemi yapılmadı. İnceleme canlı production verisini
değiştirmedi. Giriş yapmış kullanıcıya özel senaryolar ayrıca doğrulanmadı.

## Genel değerlendirme

DublajLab'in ana değeri anlaşılır: hazır sahne veya kullanıcının videosu seçiliyor,
replikler mikrofonla kaydediliyor ve sonuç MP4 olarak alınıyor. Web ve mobil
istemciler, kalıcı hesaplar, moderasyon, e-posta akışları ve medya altyapısı
oluşturulmuş. Son kaynak düzeltmesi `442e367` ile stüdyo kaynak sekmeleri arasında
geçişte seçili projenin korunması `main` dalına gönderilmiş. Canlı deployment
durumu commit'in dalda bulunmasından ayrı olarak doğrulanmalıdır.

## Takip uygulaması — 14 Kasım 2026

- Stüdyo kaynak sekmeleri arasında seçili upload ve kayıt state'inin korunduğunu,
  açık “Kaynağı değiştir” eyleminin ise projeyi sıfırladığını doğrulayan iki
  jsdom regresyon testi eklendi; frontend CI işi bu testleri çalıştıracak şekilde
  genişletildi.
- GitHub Actions'a mobil workspace için Node 22, lockfile tabanlı `npm ci`,
  typecheck, lint ve Android Expo export adımlarını içeren ayrı kalite işi eklendi.
- Yerel native hazırlama sırasında değişen mobil `android`/`ios` geliştirme
  scriptleri mevcut Expo Go davranışına döndürüldü.
- Yasal metinlerin gerçek işletme bilgileri ve uzman incelemesi gerektiren
  içeriği ile kalıcı worker geçişi ürün/operasyon kararı olarak açık bırakıldı;
  doğrulanmamış bilgi veya gereksiz altyapı eklenmedi.

En önemli sonraki aşama daha fazla özellik eklemekten önce **ticari/yasal
hazırlığı netleştirmek**, **kullanıcı projesinin güvenli devamlılığını
sağlamak** ve eklenen **mobil CI kalite kapısını korumak**. Ayrıca eski durum
belgelerinin güncel production yapılandırmasıyla eşleştirilmesi gerekiyor.

## Gezilen alanlar ve doğrulama

- Ana sayfa, stüdyo kaynak seçimi, sahne kataloğu ve sahne detayı incelendi.
- Topluluk dublajları, Günün Dublajı, giriş, kayıt, VIP üyelik ve footer yasal
  bağlantıları açılarak metinler kontrol edildi.
- Üyelik sayfası 390×844 mobil viewport'ta görüntülendi. Bu viewport'ta
  yatay sayfa taşması gözlenmedi.
- Sahne kataloğunda beş adet açıkça “Demo” olarak etiketlenmiş sentetik sahne
  görüldü. Kaynak/lisans açıklaması da gösteriliyor.
- Topluluk akışı gerçek içerik yokken boş durumu gösteriyor. Günün Dublajı ise
  “Demo İçerik” olarak etiketlenmiş ve gerçek topluluk içeriklerinin daha sonra
  ekleneceğini belirtiyor.
- Kayıt formunda parola güç ölçütleri; giriş ekranında Google ve devre dışı
  Discord seçenekleri görüldü. Gerçek kayıt veya kimlik doğrulama yapılmadı.
- VIP sayfasında ücretsiz plan için 720p, VIP için 1080p ve AI ses; VIP fiyatı
  ₺199 / 30 gün olarak gösteriliyor. Ödeme akışı başlatılmadı.
- Hakkımızda ve Kullanım Koşulları içerikleri açıkça “Taslak” olarak işaretli.
  Diğer yasal bağlantılar da aynı Public Beta taslak modal altyapısını kullanıyor.

## Tek tek bulgular ve öneriler

### 1. [P0 — Ticari kullanımdan önce] Yasal metinler ve abonelik şartları

**Gözlem:** Footer'da Gizlilik, Kullanım Koşulları, Telif Hakkı, İade ve İptal,
Mesafeli Satış bağlantıları var. Görüntülenen Hakkımızda ve Kullanım Koşulları
başlıkları “Taslak” ibaresi taşıyor ve genel beta açıklamalarından ibaret.
Üyelik sayfasında ₺199 / 30 gün fiyatı ve Shopier ödeme doğrulaması anlatılıyor.

**Öneri:** Gerçek ödeme alınmadan önce gerçek işletme/satıcı bilgileri, hizmet
kapsamı, fiyatın vergi durumu, erişim başlangıç/bitişi, yenileme veya tek seferlik
ödeme niteliği, iptal/iade süreci, destek iletişimi ve kullanıcı içerik
sorumlulukları ürün akışıyla tutarlı biçimde yayımlansın. Bu metinler hukuk
uzmanı tarafından değerlendirilmelidir; bu not hukuki görüş değildir.

**Tamamlanma ölçütü:** Her yasal bağlantı gerçek ve güncel içeriğe gider; satın
alma öncesinde toplam ücret ve erişim süresi açıkça gösterilir; ödeme sağlayıcısı
ayarları ve canlı sandbox/callback testleri kabul edilir.

### 2. [P1 — Veri güveni] Saklama, silme ve kullanıcı kontrolü

**Gözlem:** Ana sayfadaki public demo uyarısı dosyaların kalıcı saklanmadığını ve
altı saatlik temizleme politikasını bildiriyor. Bu, public demo medyasına ilişkin
net bir açıklama. Üyelikli projelerin, export'ların ve kayıtların saklama/silme
kuralları aynı kullanıcı yolculuğunda bu kadar görünür değil.

**Öneri:** Public demo, giriş yapmış kullanıcı projesi, ses kayıtları ve üretilen
export için ayrı saklama sürelerini; kullanıcı tarafından silme ve hesap silme
sonuçlarını tek bir anlaşılır gizlilik/veri ekranında açıklayın. Ham kayıtların
gereksiz yere kalıcı tutulmamasını sağlayın.

**Tamamlanma ölçütü:** Her medya türü için saklama süresi ve silme davranışı
belgelenmiş, UI'dan erişilebilir ve gerçek backend cleanup davranışıyla test
edilmiş olsun.

### 3. [P1 — İş sürekliliği] Export işi için ayrı ve dayanıklı worker

**Gözlem:** Export akışı arka plan iş durumu ve polling kullanıyor. Proje
dokümantasyonunda işlerin FastAPI `BackgroundTasks` ile uygulama sürecinde
çalıştığı ve restart sırasında süreç içi işlerin etkilenebileceği belirtiliyor.
Redis iş durumu kaydı tek başına ayrı, kalıcı iş kuyruğu/worker garantisi vermez.

**Öneri:** Kullanım ve yük bunu gerektirdiğinde kalıcı kuyruk ve ayrı worker
kullanın; retry, idempotency, eşzamanlı iş sınırı, zaman aşımı, iptal ve başarısız
iş temizliği kurallarını belirleyin.

**Tamamlanma ölçütü:** Backend deploy/restart sırasında kabul edilmiş işin sonucu
belirlenmiş bir duruma ulaşır; tekrar deneme aynı projeyi/ödemeyi çoğaltmaz;
uzun ve başarısız işler gözlemlenebilir.

### 4. [Tamamlandı — Mobil kalite kapısı] Mobil istemciyi CI'a ekleme

**Gözlem:** İlk incelemede mobil README `typecheck`, `lint` ve Expo export
doğrulaması tanımlarken GitHub Actions yalnız backend ve web adımlarını
çalıştırıyordu. Takip uygulamasında mobil için ayrı kalite işi eklendi.

**Uygulama:** Mobile workspace için lockfile tabanlı kurulum, `npm run typecheck`,
`npm run lint` ve native derleme gerektirmeyen Android Expo export kontrolü ayrı
bir GitHub Actions işi olarak eklendi. Expo SDK yükseltmelerinde Android APK
smoke build'i ayrıca planlanmalıdır.

**Tamamlanma ölçütü:** Mobil kaynak değişikliği bu kalite adımlarından geçmeden
merge edilemez; CI kullanılan Node/Expo sürümlerini açıkça sabitler.

### 5. [P1 — Proje kurtarma] Tarayıcı yenilemesinde taslak davranışı

**Gözlem:** Kaynak sekmeleri arasında geçişte proje durumu korunacak şekilde
production düzeltmesi yapıldı. Ancak seçilmiş `File`, kayıt klipleri ve editör
state'i istemci belleğinde tutuluyor; sayfa yenilenmesi veya sekmenin kapanması
sonrasında kaldığı yerden devam akışı doğrulanmış değil.

**Öneri:** Önce kullanıcıya sayfadan ayrılınca taslağın kaybolabileceğini
bildirin. Sonraki aşamada küçük metadata ve zaman çizelgesi taslağını kaydedin;
büyük video/ses dosyalarını cihazda saklama ancak açık kullanıcı tercihi,
boyut sınırı ve temizleme kontrolüyle ekleyin.

**Tamamlanma ölçütü:** Yenileme/sekme kapatma davranışı açıkça tanımlıdır; desteklenen
taslaklar geri açılır veya kayıp öncesi kullanıcıya uyarı gösterilir. Hassas medya
sessizce kalıcı depolanmaz.

### 6. [P1 — Topluluk vaadi] Demo ile gerçek topluluk içeriğini tutarlı ayırma

**Gözlem:** “Dublajlar” sayfası henüz gerçek yayın olmadığını söyleyen boş durum
gösteriyor. “Günün Dublajı” ayrı bir sentetik demo sunuyor ve demo uyarısı içeriyor.
Bu şeffaf; yine de gezinme menüsünde iki alan benzer biçimde gerçek topluluk
özelliği gibi algılanabilir.

**Öneri:** Demo kartlarını aynı görsel etiket ve açıklamayla belirtin; gerçek
topluluk içeriği yokken Günün Dublajı'nı demo vitrin olarak adlandırın. İlk gerçek
içerikler geldiğinde demo ve kullanıcı içeriğinin sıralama/filtre ayrımını koruyun.

**Tamamlanma ölçütü:** Anonim kullanıcı her örnek içeriğin demo mu kullanıcı
içeriği mi olduğunu kart ve detay ekranında ayırt edebilir.

### 7. [P1 — Dokümantasyon] README ve durum raporlarını production ile hizalama

**Gözlem:** Ana README production e-posta yapılandırmasını SMTP değişkenleriyle
anlatıyor; Sprint 53/57/62 kayıtları production teslimatının Resend HTTPS
üzerinden yürüdüğünü ve kullanılmayan SMTP değişkenlerinin kaldırıldığını
belgeliyor. `RAPOR.md` hâlâ Sprint 55 durum başlığı taşıyor; Sprint 62'ye kadar
olan kayıtlar ayrı raporlarda.

**Öneri:** README'deki canlı yapılandırma bölümünü Resend'i esas alacak şekilde
düzeltin; `RAPOR.md` için güncel tekil durum özeti ve son doğrulama tarihini
belirleyin. Tarihli deployment planı tarihsel referanssa bunu açıkça işaretleyin.

**Tamamlanma ölçütü:** Secret adı/değeri açığa çıkarmadan, yeni geliştirici
production e-posta ve deploy akışını doğru dokümandan takip edebilir; tamamlanmış
ve bekleyen işler karışmaz.

### 8. [Tamamlandı — Regresyon önleme] Stüdyo kaynak geçişi için otomatik test

**Gözlem:** Hazır sahne seçimi ve yükleme sekmeleri arasında state koruma
düzeltmesi `main` dalına gönderildi. İlk incelemede bu kullanıcı akışını doğrudan
kapsayan bir UI testi yoktu; takip uygulamasında test eklendi.

**Uygulama:** Stüdyo için jsdom entegrasyon testi eklendi. Test, yüklenen video ve
kayıt state'inin kaynak sekmeleri arasında korunduğunu; açık “Kaynağı değiştir”
eyleminin projeyi sıfırladığını doğruluyor. Yeni template/video seçiminin kaynak
kimliğini değiştirdiği senaryolar sonraki genişletme olarak korunmalıdır.

**Tamamlanma ölçütü:** Test seçili dosya, sahne replikleri ve kayıt state'inin
yalnızca sekme değişiminde korunduğunu; yeni kaynak seçilince beklenen şekilde
yenilendiğini doğrular.

### 9. [P2 — İçerik ve lisans] Katalog için sürdürülebilir içerik kaynağı

**Gözlem:** Katalogda beş sentetik demo sahne var ve her birinde Demo ile
`CC0 / Generated synthetic demo` açıklaması gösteriliyor. Bu güvenli başlangıç;
uzun süre yalnızca beş örnek, tekrar kullanım hissi yaratabilir.

**Öneri:** Kataloğu yalnızca kullanım hakkı doğrulanmış, kaynak/lisans metadata'sı
eksiksiz içeriklerle büyütün. İçerik onay, kaldırma ve raporlama akışını her yeni
kaynak için işletin; popüler film/dizi kesitlerini varsayılan demo içeriği
yapmayın.

**Tamamlanma ölçütü:** Her sahnenin lisansı ve kaynağı yönetilebilir metadata'da
bulunur; kullanım hakkı belirsiz içerik yayımlanamaz.

### 10. [P2 — Mobil içerik doğruluğu] Stüdyo konumu özelliğinin çerçevesi

**Gözlem:** Mobil sürümde harita/konum/yol tarifi ekranı mevcut. Kaynakta pin
“Temsili konum” olarak işaretli.

**Öneri:** Gerçek, ziyaret edilebilir bir stüdyo yoksa bu alanı ofis/yol tarifi
vaadi yerine sanal stüdyo veya iletişim alanı olarak sunun; varsa adresin,
haritanın ve dış harita yönlendirmesinin işletme bilgileriyle aynı olduğunu
doğrulayın.

**Tamamlanma ölçütü:** Haritadaki konumun temsili mi gerçek mi olduğu ekranda
yanlış anlaşılmayacak şekilde açıklanır.

### 11. [P2 — Gözlemlenebilirlik] Gerçek kullanıcı yolculuğu ölçümü

**Gözlem:** Web ve backend'de admin operasyon metrikleri bulunuyor; bu incelemede
anonim ziyaretçinin katalogdan ilk başarılı export'a dönüşümünü ölçen bir
ürün metriği doğrulanmadı.

**Öneri:** Gizlilik dostu, kişisel içerik veya e-posta toplamayan olaylarla
funnel'ı ölçün: katalog görüntüleme, kaynak seçimi, upload sonucu, ilk kayıt,
export sonucu ve terk edilen adım. Hataları kullanıcıya açıklayıcı correlation ID
ile destek akışına bağlayın.

**Tamamlanma ölçütü:** Dönüşüm ve başarısızlık oranları hesaplanabilir; içerik,
token, e-posta ve ham medya telemetry'ye gönderilmez.

### 12. [P1 — Güven ve güvenlik] Uygunsuz video için yayın öncesi ve sonrası süreç

**Mevcut durum:** Backend uzantı/MIME/başlık kontrolü yapıyor, yükleme boyutunu
sınırlıyor ve FFprobe ile videonun açılıp süresinin uygunluğunu doğruluyor.
Bunlar dosya biçimi ve kaynak tüketimi kontrolleridir; videoda ne bulunduğunu
değerlendiren içerik moderasyonu değildir. Public dublajları raporlama ve admin
tarafından gizleme altyapısı mevcut. Raporlama yükleme öncesi önleyici kontrolün
yerini tutmaz.

**Öneri — içerik işleme ile yayınlamayı ayırın:**

1. **Yüklemeden önce:** Dosya seçicinin yanında, kısa ve görünür içerik
   kuralları gösterin. Kullanıcı içeriği yüklemeye veya kaydetmeye devam etmeden
   önce kullanım hakkına sahip olduğunu ve gerçek kişileri yanıltıcı/taklit edici
   biçimde sunmadığını onaylasın. Onay, yasa dışı veya zararlı içeriğe izin
   verdiği anlamına gelmemeli; kurallar ve raporlama bağlantısı ayrıca açık
   olmalı.
2. **İşleme sırasında:** Dosyayı varsayılan olarak özel tutun; video yüklemek
   onu topluluğa yayımlamasın. Format/süre/limit doğrulamasını sürdürün ve medya
   decoder/export işlemlerini süre, bellek ve eşzamanlılık sınırlarıyla çalıştırın.
   Dosya verisini log veya analitik olaylarına koymayın.
3. **Yayına almadan önce:** Kullanıcı özellikle herkese açık paylaşmayı seçsin
   ve paylaşılacak başlık/görünürlük için açık bir son onay versin. Açıkça
   yasaklanmış yüksek riskli içerik için otomatik sinyaller kullanılacaksa bunlar
   öncelikle inceleme kuyruğu oluştursun; belirsiz bir model skoru tek başına
   yaptırım veya kalıcı hesap kapatma nedeni olmasın. Otomatik tarama sağlayıcısına
   video gönderilecekse üçüncü taraf aktarımı ve saklama koşulları önceden
   açıklanıp veri minimizasyonu uygulanmalı.
4. **Rapor ve müdahale:** Video ve yorum için kolay görünen “Raporla” akışı;
   telif, rıza/mahremiyet, taklit/yanıltma, tehdit/nefret, cinsel içerik ve diğer
   sebepleri ayırsın. Acil ve ciddi zarar iddiasında içeriği geçici olarak
   yayından gizleme ve hızlı insan incelemesi yolu olsun. Haksız raporlar için
   yeniden inceleme/itiraz yolu da tanımlansın.
5. **İnsan moderasyonu:** Moderatöre karar bağlamı, içerik/proje kimliği, zaman,
   gerekçe ve eylem kaydı gösterilsin. Erişim sınırlı olsun; hassas medyayı
   gereksiz yere indirip paylaşmayın. Saklama ve silme takvimi belirleyin.

Asgari yasaklı içerik politikası, hukuki incelemeyle netleştirilerek; çocukların
cinsel istismarı veya cinselleştirilmesi, rıza dışı mahrem görüntüler, inandırıcı
hedefli tehdit/şiddet, kişisel bilgilerin ifşası ve ağır taciz gibi yüksek zarar
alanlarını açıkça kapsamalı. Telifli materyal için hak sahipliği/izin ve geçerli
ihlal bildirimi süreci; gerçek kişilerin sesi/yüzü için rıza ve yanıltıcı
deepfake/impersonation politikası ayrıca belirtilmeli. Yaptırım ve yasal bildirim
adımları uzman danışmanlıkla belirlenmelidir.

**İlk sürüm için pratik sıra:** (a) kuralları upload ve public paylaşım
adımlarında gösterin, (b) public görünürlüğü yalnızca ayrı kullanıcı onayıyla
açın, (c) rapor endpoint'ini suistimale karşı hız sınırlaması ve tekrar rapor
kontrolüyle koruyun, (d) admin gizleme/inceleme için sorumlu kişi ve hedef yanıt
süresi belirleyin, (e) moderasyon eylemlerini audit edin ve kullanıcıya karar/
itiraz bilgisini verin. Otomatik video sınıflandırmasını ancak mahremiyet,
doğruluk ve yanlış pozitifler için değerlendirme yapıldıktan sonra ekleyin.

**Tamamlanma ölçütü:** Kullanıcı yükleme öncesinde kuralları bulabilir; her
yüklenen içerik varsayılan olarak private kalır; public geçiş için ayrı onay
gerekir; rapor geldiğinde atanmış bir inceleme yolu, zaman hedefi, gizleme/
kaldırma kararı ve itiraz kanalı vardır. Format doğrulaması moderasyon olarak
sunulmaz.

## Güçlü taraflar — korunması gerekenler

- Katalog sahnelerinin sentetik demo ve lisans bilgisiyle etiketlenmesi.
- Topluluk akışında gerçek içerik yokken sahte kullanıcı gönderisi yerine dürüst
  boş durum gösterilmesi.
- Public demo limitleri ve geçici medya saklama süresinin ana sayfada
  açıklanması.
- Kayıt formunda parola gücü ölçütlerinin kullanıcıya yazarken gösterilmesi.
- VIP hakkının yalnızca arayüzde değil backend'de denetlenmesi yönündeki ürün
  açıklaması ve servis tasarımı.
- 390px mobil görünümünde yatay taşmanın gözlenmemesi.
- Kaynak sekmeleri arasında gezinme ile kaynağı açıkça değiştirme eyleminin ayrı
  tutulmasına yönelik son stüdyo düzeltmesi.

## Önerilen sıra

1. Gerçek satışa açılmadan yasal/fiyat/iptal/iade ve veri saklama metinlerini
   tamamlayın.
2. Eklenen mobile lint/typecheck/Expo export CI işini ve stüdyo kaynak geçişi
   regresyon testlerini zorunlu kalite kapısı olarak koruyun.
3. Video taslağı yenileme/kapanma davranışını belirleyin; kayıp uyarısı veya
   kullanıcı kontrollü yerel taslak kurtarma seçeneği ekleyin.
4. README ve `RAPOR.md`'yi güncel Resend/production yapılandırmasıyla hizalayın.
5. Topluluk/demo anlatımını ve mobil stüdyo konumu metnini netleştirin.
6. Kullanım ve hata telemetrisi verisine göre dayanıklı worker, daha geniş
   katalog ve ek stüdyo araçlarını önceliklendirin.
