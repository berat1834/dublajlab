# Sprint 58 — GitHub Actions Node 24 Geçişi

## Sonuç

CI workflow'undaki GitHub tarafından yayımlanan action'lar, resmi güncel ve Node 24
tabanlı major sürümlere geçirildi:

- `actions/checkout@v4` → `actions/checkout@v7`
- `actions/setup-python@v5` → `actions/setup-python@v7`
- `actions/setup-node@v4` → `actions/setup-node@v7`

Python 3.12, Node.js 22, dependency cache yolları ve test/build komutları
değiştirilmedi.

GitHub-hosted `ubuntu-latest` etiketinin Ubuntu 26'ya yaklaşan geçişinde sürpriz
ortam değişikliği yaşamamak için backend ve frontend işleri açıkça
`ubuntu-24.04` runner'ına sabitlendi.

## Doğrulama

- `.github/workflows/ci.yml` YAML olarak başarıyla ayrıştırıldı.
- `git diff --check` geçti.
- Son kabul, GitHub-hosted runner üzerinde tetiklenen main CI çalışmasıdır.
