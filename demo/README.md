# Yerel demo videosu

Bu klasöre DublajLab'ı test etmek için kendi çektiğiniz veya açık lisansla kullanma hakkına sahip olduğunuz kısa bir video koyabilirsiniz.

Kurallar:

- Telifli film, dizi, YouTube, TikTok veya Instagram içeriği eklemeyin.
- Gerçek kişileri yanıltıcı biçimde taklit etmek için kullanmayın.
- Repo herkese açık olacaksa video sahibinin yayın iznini kontrol edin.
- Önerilen test dosyası: 5–15 saniye, MP4/H.264, 720p veya daha düşük, 50 MB altında.
- Video dosyaları Git'e eklenmez; `.gitignore` bu klasörde README dışındaki dosyaları hariç tutar.

Örnek timeline:

```json
[
  {
    "id": "line-1",
    "start": 0.5,
    "end": 2.5,
    "text": "İlk deneme repliğim burada."
  },
  {
    "id": "line-2",
    "start": 3.0,
    "end": 5.0,
    "text": "İkinci replik tam zamanında başladı."
  }
]
```

Bu JSON'u ayrıca yüklemeniz gerekmez; aynı değerleri frontend'deki replik editörüne girin.

