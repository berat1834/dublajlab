# Sprint 29: Local Wav2Lip Inference Test Altyapısı

## Amaç ve Kapsam
Bu sprintin amacı, Dudak Senkronizasyonu (Lip-Sync) işlemi için yerel (Windows/PowerShell) test altyapısını oluşturmaktır. Üçüncü taraf modellerin projeye entegrasyonu güvenli ve izole bir şekilde tamamlanmıştır.

## Yapılan Geliştirmeler

### 1. Model İndirme Talimatları Güncellendi
- Büyük boyutlu model dosyalarının (Wav2Lip `.pth` formatları) repo içerisinde şişkinliğe yol açmaması için Git'ten (`.gitignore` ile) gizli tutulması kuralı pekiştirildi.
- Kullanıcıların bu modelleri Wav2Lip'in resmi kaynaklarından (Google Drive / GitHub) indirebilmesi için `backend/weights/README.md` içerisine adım adım Türkçe kurulum talimatları eklendi.

### 2. Servis Entegrasyonu Refactoring (lip_sync_service.py)
- `backend/services/lip_sync_service.py` dosyasındaki mock `asyncio.sleep` asenkron `subprocess` mimarisiyle güncellenmişti; bu sprintte çağrı yapısı `Wav2Lip/inference.py` yolunu hedefleyecek şekilde netleştirildi.
- Subprocess'in `process.returncode != 0` ile başarısız olması durumunda, fırlatılan Exception mesajı teknik bir hata yerine son kullanıcının anlayabileceği Türkçe formata dönüştürüldü: *"Dudak senkronizasyonu işlemi yerel motor (Wav2Lip) tarafından reddedildi."*

### 3. İzole Test Betiği (scripts/run_local_lipsync.ps1)
- Tüm sistemi ayağa kaldırmadan (`Uvicorn` sunucusuna ihtiyaç duymadan) yalnızca dudak senkronizasyonu modelini yerelde (lokal olarak) test etmek için bir PowerShell betiği oluşturuldu.
- Bu betik, `demo/input/` klasöründeki mevcut test videolarını/seslerini alır, Python servisini (LipSyncService) doğrudan izole biçimde çağırır ve başarılı olursa sonucu `demo/output/` klasörüne kaydeder. Hata durumunda betik uygun Türkçe mesajı verir ve güvenle kapanır.

## Test ve Doğrulama (Validation)
- 🟢 Backend unit/smoke testleri `pytest` ile çalıştırılarak eski entegrasyonların ve model hata fırlatma senaryolarının hala başarılı olduğu teyit edildi.
- 🟢 Frontend (React/Vite) projesinde herhangi bir yan etki olmadığından emin olmak için `npm run lint` testleri sıfır hata ile geçti.

## Gelecek Notları / Riskler
- **Modellerin Konumu**: `Wav2Lip/` klasörünün projenin kök dizininde olduğu ve `backend/weights/` klasöründe model ağırlıklarının bulunduğu varsayılmaktadır. Üretim (Production) veya test sunucusuna dağıtım yapılırken bu dosyaların sunucuya manuel veya ayrı bir script ile kopyalanması unutulmamalıdır.
