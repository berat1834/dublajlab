# Production Media Persistence Audit

> **Sprint:** 32  
> **Tarih:** 28 Eylül 2026  
> **Kapsam:** Railway volume mount ile backend `MEDIA_ROOT` uyumu, medya kalıcılığı, temizlik servisi davranışı

---

## 1. Özet Sonuç

| Kontrol | Durum | Not |
|---------|-------|-----|
| `MEDIA_ROOT` env tanımı | ✅ Tutarlı | Dockerfile, docker-compose, DEPLOYMENT_PLAN hepsi `/app/media` |
| Railway Volume mount hedefi | ✅ Doğru | Dokümantasyon `/app/media` diyor |
| `config.py` fallback | ⚠️ Dikkat | Env yoksa `backend/data` kullanır (lokal dev için) |
| `FileStorageService` path kaynağı | ✅ Güvenli | Tüm yazımlar `config.py` sabitlerinden |
| `CleanupService` hedef dizinleri | ✅ Güvenli | Aynı `config.py` sabitlerini kullanır |
| PostgreSQL (kullanıcı verileri) | ✅ Kalıcı | Railway managed PostgreSQL |
| Bulut depolama entegrasyonu | ❌ Yok | S3/R2/Supabase Storage henüz entegre edilmedi |

**Genel Değerlendirme:** Kod ve konfigürasyon tutarlıdır. Dockerfile'da `MEDIA_ROOT=/app/media` hardcode edilmiştir ve Railway volume bu path'e mount edildiği sürece medya dosyaları deploylar arasında korunur.

---

## 2. Detaylı Path Analizi

### 2.1 Backend Config (`backend/config.py`)

```python
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", BASE_DIR / "data")).resolve()
UPLOAD_DIR   = MEDIA_ROOT / "uploads"
OUTPUT_DIR   = MEDIA_ROOT / "outputs"
AUDIO_DIR    = MEDIA_ROOT / "audio"
SUBTITLE_DIR = MEDIA_ROOT / "subtitles"
RECORDING_DIR = MEDIA_ROOT / "recordings"
TEMP_DIR     = MEDIA_ROOT / "tmp"
METADATA_DIR = MEDIA_ROOT / "metadata"
```

- **Production (Railway):** `MEDIA_ROOT=/app/media` → env var Dockerfile satır 7'de set edilir
- **Lokal geliştirme:** `MEDIA_ROOT` env yoksa → `backend/data` (göreli yol, volume değil)
- **Docker Compose:** `MEDIA_ROOT=/app/media` → `docker-compose.yml` satır 12

### 2.2 Dockerfile (`backend/Dockerfile`)

```dockerfile
ENV MEDIA_ROOT=/app/media      # Satır 7
WORKDIR /app                   # Satır 13
RUN mkdir -p /app/media        # Satır 20
```

### 2.3 Docker Compose (`docker-compose.yml`)

```yaml
volumes:
  - dublajlab_media:/app/media   # Satır 25
```

### 2.4 DEPLOYMENT_PLAN.md

```text
Volume mount path: /app/media   # Satır 85
MEDIA_ROOT=/app/media           # Satır 52
```

Tüm dökümantasyon tutarlıdır.

---

## 3. FileStorageService — Dosya Yazım Path'leri

| İşlem | Hedef Dizin | Config Sabiti |
|-------|-------------|---------------|
| Video yükleme | `MEDIA_ROOT/uploads/` | `UPLOAD_DIR` |
| Çıktı video | `MEDIA_ROOT/outputs/` | `OUTPUT_DIR` |
| Ses kaydı | `MEDIA_ROOT/recordings/` | `RECORDING_DIR` |
| Birleştirilmiş ses | `MEDIA_ROOT/audio/` | `AUDIO_DIR` |
| Altyazı (ASS) | `MEDIA_ROOT/subtitles/` | `SUBTITLE_DIR` |
| Metadata (JSON) | `MEDIA_ROOT/metadata/` | `METADATA_DIR` |
| Geçici dosyalar | `MEDIA_ROOT/tmp/` | `TEMP_DIR` |

Tüm path'ler `config.py`'deki `MEDIA_ROOT` sabitinden türetilir. Hardcode path yoktur.

---

## 4. CleanupService Davranışı

Temizlik kuralları:
- Yalnız `older_than_hours` (varsayılan 24 saat) üzerindeki dosyalar silinir
- `.` ile başlayan dosyalar (dotfiles) atlanır
- Alt dizinler atlanır (yalnız dosyalar silinir)
- Demo modu etkinse `DEMO_MEDIA_TTL_HOURS` (6 saat) kullanılır

**Risk:** Giriş yapmış kullanıcıların kalıcı export'ları da 24 saat sonra silinebilir.

---

## 5. Railway Volume Doğrulama

| Ayar | Beklenen Değer |
|------|----------------|
| Volume mount path | `/app/media` |
| Backend env: `MEDIA_ROOT` | `/app/media` (Dockerfile'da set) |

**Kontrol:** Railway Console'a girip `ls -la /app/media` komutu çalıştır.

---

## 6. Riskler ve Öneriler

| Risk | Seviye | Öneri |
|------|--------|-------|
| Disk dolma | Orta | Export'lara 30 gün TTL ekle |
| Volume detach | Düşük | Snapshot/backup araştır |
| Çoklu worker | Yok (tek worker) | Mevcut yapıda risk yok |
| Bulut depolama eksikliği | Gelecek sprint | Kullanıcı 100+ olduğunda R2/S3 |

---

## 7. Test Sonuçları

```
18 passed, 5 warnings in 1.34s
```

---

## 8. Yapılan Değişiklikler

Bu audit kapsamında **kod değişikliği yapılmadı**. Mevcut path konfigürasyonu tutarlı ve doğrudur.
