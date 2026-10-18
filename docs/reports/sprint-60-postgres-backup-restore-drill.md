# Sprint 60 — PostgreSQL Yedekleme ve Geri Yükleme Tatbikatı

## Sonuç

Railway production PostgreSQL veritabanından `pg_dump` custom-format yedeği
alındı ve üretim sisteminden tamamen ayrı, geçici bir PostgreSQL 18 Docker
konteynerine başarıyla geri yüklendi. Tatbikat production veritabanında yazma
işlemi yapmadı.

## Uygulama

- `scripts/postgres_backup_restore_drill.ps1` eklendi.
- Betik `DATABASE_PUBLIC_URL` varsa onu, yoksa `DATABASE_URL` değişkenini
  kullanır.
- Özel Railway ağı için `TunnelHost` ve `TunnelPort` parametreleri desteklenir.
- Yedek `postgres:18-alpine` içindeki sürüm uyumlu `pg_dump` ile alınır.
- Geri yükleme tek kullanımlık, yerel PostgreSQL 18 konteynerinde yapılır.
- `pg_restore --exit-on-error` sonrasında public tablo sayısı, Alembic sürümü ve
  kullanıcı kayıt sayısı doğrulanır.
- Geçici konteyner ve hassas yedek dosyası `finally` bloğunda kaldırılır.
  Yedek yalnızca açıkça `-KeepDump` verilirse tutulur.

## Production doğrulaması

18 Ekim 2026 tarihli gerçek tatbikat sonucu:

- Durum: `PASS`
- Yedek boyutu: 25.820 bayt
- SHA-256: `A6D2433498AD4B59313E0977E545B13058C56A049BA0AED159F57E6002840BFB`
- Public tablo sayısı: 10
- Alembic sürümü: `a1b2c3d4e5f7`
- Kullanıcı kayıt sayısı: 6
- Geri yükleme hedefi: geçici `postgres:18-alpine` konteyneri
- Production yedeği tatbikat sonunda silindi.

Railway veritabanının public TCP proxy'si olmadığı için bağlantı, geçici SSH
anahtarı ve yerel SSH tüneli üzerinden kuruldu. Tatbikat sonunda tünel
kapatıldı; Railway'e kaydedilen anahtar ve iki yerel anahtar çifti kaldırıldı.
Geçici konteyner kalmadığı doğrulandı.

## Tekrar çalıştırma

1. Railway CLI ile giriş yap ve projeyi production ortamına bağla.
2. PostgreSQL servisine geçici SSH tüneli aç:

   ```powershell
   railway connect Postgres --environment production --ssh --tunnel-only --port 55433
   ```

3. Ayrı bir terminalde Railway değişkenleriyle tatbikatı çalıştır:

   ```powershell
   railway run --service Postgres --environment production -- powershell `
     -NoProfile -ExecutionPolicy Bypass `
     -File .\scripts\postgres_backup_restore_drill.ps1 `
     -TunnelHost host.docker.internal -TunnelPort 55433
   ```

4. `Status : PASS` sonucunu kaydet ve SSH tünelini kapat.

Tatbikat çıktısı secret veya bağlantı parolası yazdırmaz. Production yedeği
kişisel veri içerebileceği için `-KeepDump` normal operasyonlarda
kullanılmamalıdır.

