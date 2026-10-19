# Sprint 62 — Destek E-posta Yönlendirmesi

## Sonuç

Kullanıcı arayüzünde yayımlanan `destek@dublajlab.com.tr` adresi, ProMail üzerinde
`hesap@dublajlab.com.tr` posta kutusuna teslim edilen bir rumuz olarak oluşturuldu.
Böylece ayrı bir posta kutusu lisansı gerektirmeden destek iletileri mevcut kurumsal
posta kutusunda alınabiliyor.

## Production doğrulaması

- Rumuz oluşturulduktan sonra gerçek bir Resend iletisi
  `destek@dublajlab.com.tr` adresine gönderildi.
- İleti için production webhook'unda `email.delivered` olayı görüldü; hata nedeni
  bulunmadı.
- Railway backend servisindeki `RESEND_REPLY_TO`,
  `destek@dublajlab.com.tr` olarak güncellendi.
- Değişken güncellemesinin tetiklediği deploy başarıyla tamamlandı.
- Çalışan ortamın hedef Reply-To değerini aldığı, değeri açığa çıkarmayan bir
  eşitlik kontrolüyle doğrulandı.
- Canlı `https://api.dublajlab.com.tr/api/health` endpoint'i HTTP 200 döndürdü;
  Redis hem yapılandırılmış hem bağlı kaldı.
- Uygulamanın Resend gönderim yolu üzerinden `hesap@dublajlab.com.tr` adresine
  bir Reply-To doğrulama iletisi başarıyla kabul edildi.

## Operasyon notu

Yeni işlem e-postalarında görünen gönderici, doğrulanmış Resend alt alanındaki
`hesap@send.dublajlab.com.tr` adresidir. Alıcı **Yanıtla** dediğinde yanıt
`destek@dublajlab.com.tr` rumuzuna yönelir ve ProMail'deki `hesap@` posta kutusuna
teslim edilir.
