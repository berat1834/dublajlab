# Yerel demo paketi

Bu klasör DublajLab'ı test etmek için kendi çektiğiniz veya açık lisansla kullanma hakkına sahip olduğunuz kısa videoların yerel çalışma alanıdır. Medya ve üretilen çıktılar Git'e eklenmez.

```text
demo/
├── input/                       # Kendi kaynak videonuzu buraya koyun
├── output/                      # Manuel test çıktılarını burada tutabilirsiniz
├── metadata/
│   └── template.example.json   # Template metadata başlangıç örneği
└── README.md
```

Kurallar:

- Telifli film, dizi, YouTube, TikTok veya Instagram içeriği eklemeyin.
- Gerçek kişileri yanıltıcı biçimde taklit etmek için kullanmayın.
- Repo herkese açık olacaksa video sahibinin yayın iznini kontrol edin.
- Önerilen test dosyası: 5–15 saniye, MP4/H.264, 720p veya daha düşük, 50 MB altında.
- `input/` ve `output/` içindeki medya dosyaları Git'e eklenmez; yalnızca klasör iskeleti ile güvenli metadata örneği sürümlenir.
- Template olarak yayınlanacak doğrulanmış medya, test bittikten sonra `frontend/public/templates/` altına ayrıca ve bilinçli biçimde eklenmelidir.

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

Template kataloğuna bağlama, lisans/source yazımı ve portföy ekran görüntüsü hazırlama adımları için [Demo ve Portföy Rehberi](../docs/DEMO_GUIDE.md) dosyasını okuyun.
