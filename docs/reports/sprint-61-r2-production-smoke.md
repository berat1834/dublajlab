# Sprint 61 — R2 Production Yükleme, İndirme ve Silme Smoke Testi

## Sonuç

Cloudflare R2 production bucket'ı için gerçek S3 uyumlu API akışı başarıyla
doğrulandı. Test yalnızca rastgele UUID içeren küçük bir `smoke-tests/` nesnesi
oluşturdu ve işlem sonunda aynı nesneyi sildi.

## İlk bulgu

18 Ekim 2026 tarihli ilk denemede bucket healthcheck başarılı olmasına rağmen
`PutObject` isteği `AccessDenied` aldı. Bu sonuç endpoint ve bucket erişiminin
doğru, ancak mevcut kimlik bilgisinin nesne yazma yetkisinin eksik olduğunu
gösterdi.

Cloudflare R2 anahtarı yalnız `dublajlab-media` bucket'ı için `Object Read &
Write` yetkisiyle yenilendi. Yeni Access Key ID ve Secret Access Key yalnız
Railway backend environment değişkenlerinde saklandı; repoya veya test çıktısına
yazılmadı.

## Production kabulü

Railway backend production değişkenleriyle çalışan opt-in test şu adımları geçti:

1. Bucket healthcheck
2. Rastgele `smoke-tests/<uuid>.mp4` nesnesini yükleme
3. `HeadObject` ile nesnenin varlığını doğrulama
4. İndirme URL'si üretme
5. `GetObject` ile içeriği indirme ve yüklenen byte'larla birebir karşılaştırma
6. Test nesnesini silme
7. Silme sonrası nesnenin bulunmadığını doğrulama

Test sonucu: `1 passed`.

Deploy sonrası `https://api.dublajlab.com.tr/api/health` HTTP 200 döndürdü;
`redis_configured` ve `redis_connected` değerleri `true` kaldı.

## Güvenlik ve temizlik

- Test anahtarı UUID ile benzersiz üretildi.
- Kullanıcı medyasına veya mevcut production nesnelerine dokunulmadı.
- Test nesnesi `finally` bloğunda silindi.
- Test artık indirilen içeriği de doğruladığı için yalnız URL üretimini değil,
  gerçek okuma yetkisini ve veri bütünlüğünü de kapsıyor.

