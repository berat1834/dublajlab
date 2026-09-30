# Wav2Lip Model Weights

This directory is intended to store the pre-trained model weights for the Wav2Lip lip synchronization feature.

**Important Note:**
Model weight files (`.pth`) are extremely large and **MUST NOT** be committed to Git. The `.gitignore` file is configured to exclude them.

> **Lisans sınırı:** Resmî Wav2Lip kodu ve açık model ağırlıkları yalnızca
> kişisel, akademik ve araştırma amaçlı kullanıma açıktır. Ticari kullanım
> yasaktır. Bu ağırlıkları DublajLab'ın ücretli/VIP production özelliğinde
> kullanmayın. Ticari yayın öncesinde uygun lisanslı bir model veya sağlayıcı
> seçilmelidir.

### Gerekli Modellerin Kurulumu (Adım Adım):
Dudak senkronizasyonu işleminin çalışabilmesi için resmi Wav2Lip deposundan aşağıdaki modelleri indirip tam olarak bu klasöre (`backend/weights/`) koymalısınız:

1. **`wav2lip_gan.pth`** (Ana Wav2Lip GAN Modeli)
   - **İndirme Linki:** [Wav2Lip + GAN (Google Drive)](https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/EdjI7bZpX-xHzX-VGtDceIMB-qbK-23B1P4Fm4e2g9V9vQ?e=2T8M8D) (veya [GitHub Reposu](https://github.com/Rudrabha/Wav2Lip) üzerinden güncel alternatif linki bulun).
   - **Dosya Adı:** İndirdiğiniz dosyayı tam olarak `wav2lip_gan.pth` olarak adlandırıp bu klasöre taşıyın.

2. **`s3fd.pth`** (Yüz Tanıma Modeli)
   - **İndirme Linki:** [s3fd (Google Drive)](https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth) (Wav2Lip deposunda face detection modeli olarak geçmektedir).
   - **Dosya Adı:** Dosyayı tam olarak `s3fd.pth` olarak adlandırıp bu klasöre taşıyın.

Kurulumdan sonra klasör yapısı şu şekilde görünmelidir:
```
backend/weights/
  ├── .gitkeep
  ├── README.md
  ├── s3fd.pth
  └── wav2lip_gan.pth
```

Resmî kaynak kodu yerel test için proje kökündeki `Wav2Lip/` klasörüne
yerleştirilebilir. Bu klasör Git tarafından yok sayılır; üçüncü taraf kaynak
kod ve model dosyaları DublajLab reposuna commit edilmez.
