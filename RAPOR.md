# DublajLab Project Report

## Current Status

- Faz 1-11 kapsamındaki MVP, profesyonel ürünleştirme, platform showcase (placeholder), UI refactor ve portföy sunumu hazırlıkları tamamlandı.
- Ana akış, kullanıcının kendi mikrofon kaydını zamanlanmış repliklere yerleştirir.
- FastAPI backend video yükleme, doğrulama, export ve indirme API'lerini sunar.
- React/Vite frontend kaynak seçimi, kayıt timeline'ı ve sonuç ekranını yönetir.
- FFmpeg/FFprobe ses miksleme, altyazı gömme ve MP4 üretiminde kullanılır.
- AI TTS, ana akıştan ayrı ve opsiyonel bir dublaj modu olarak korunur.
- JSON tabanlı template kataloğu telif ve kaynak metadata'sıyla hazırdır.
- Export işlemleri memory tabanlı job registry ve progress polling ile izlenir.
- Docker Compose yerel production benzeri backend/frontend ortamını sağlar.
- Public demo modu upload, süre, kayıt boyutu ve günlük export limitleri uygular.
- Geçici medya için token korumalı cleanup ve TTL politikası belgelenmiştir.
- Ürün arayüzü desktop ve mobil için görsel QA'dan geçirilmiştir.
- Proje portföy sunumu ve public demo deployment hazırlığı aşamasındadır.

## Completed Phases

| Phase | Summary | Report |
| ----- | ------- | ------ |
| 1 | Production Hardening (FFmpeg timeouts, token auth) | [sprint-01-hardening.md](docs/reports/sprint-01-hardening.md) |
| 2 | Profesyonel Kullanıcı Deneyimi (UX/UI iyileştirmeleri) | [sprint-02-ux.md](docs/reports/sprint-02-ux.md) |
| 3 | Hazır Video / Template Sistemi | [sprint-03-template-catalog.md](docs/reports/sprint-03-template-catalog.md) |
| 3.5 | Demo Paketi ve Portföy Sunumu | [sprint-035-demo-assets.md](docs/reports/sprint-035-demo-assets.md) |
| 4 | Job Queue ve Gerçek Progress (FastAPI Background Tasks) | [sprint-04-job-queue.md](docs/reports/sprint-04-job-queue.md) |
| 5 | Docker + Local Production Setup | [sprint-05-docker.md](docs/reports/sprint-05-docker.md) |
| 6 | Public Demo Safety + Rate Limit + Cleanup Policy | [sprint-06-public-demo-safety.md](docs/reports/sprint-06-public-demo-safety.md) |
| 7 | Product Polish + Demo Content UX (Visual QA, Animations) | [sprint-07-product-polish.md](docs/reports/sprint-07-product-polish.md) |
| 8 | Platform Shell + Navigation + Footer (Multi-tab UX, Auth placeholders) | [sprint-08-platform-shell.md](docs/reports/sprint-08-platform-shell.md) |
| 9 | Showcase Pages + Placeholder Content (Gallery Filters, Dubs, Daily Dub) | [sprint-09-showcase-pages.md](docs/reports/sprint-09-showcase-pages.md) |
| 10 | UI Component Refactoring (App.tsx modularization) | [sprint-10-ui-refactor.md](docs/reports/sprint-10-ui-refactor.md) |
| 11 | Demo Launch Readiness + Portfolio Assets | [sprint-11-portfolio-assets.md](docs/reports/sprint-11-portfolio-assets.md) |
| 12 | Safe Demo Media Integration Plan | [demo-media-plan.md](docs/demo-media-plan.md) |
| 13 | Scene Detail Page & Template Preview | [sprint-13-scene-detail.md](docs/reports/sprint-13-scene-detail.md) |

Deployment ayrıntıları için [DEPLOYMENT_PLAN.md](DEPLOYMENT_PLAN.md) belgesine bakın.

## Latest Validation

- Backend tests: 51/51 passed (includes real FFmpeg integration test)
- Frontend lint/build: Passed (ESLint & Vite production build)
- Docker smoke test: `healthy` status for both API and Nginx container, tested locally
- CI status: GitHub Actions yapılandırması mevcut; bu dokümantasyon commit'inin sonucu push sonrasında doğrulanacak.

## Known Risks

- Memory job registry: Backend process restart kayıplarına yol açabilir (Dağıtık ortamda Redis gerektirir).
- Railway volume: Mevcut deployment planına göre data volume'u kullanıldığında scale-out (çoklu replica) sorunları çıkabilir.
- Public demo limits: Memory tabanlı rate limiter process restart durumunda sıfırlanır.
- Edge TTS dependency: Dış servis bağımlılığı, ileride TTS çalışmazsa fallback mekanizması gerektirebilir.

## Next Steps

- `docs/assets/README.md` içinde belirtilen kalıcı placeholder yolları için **gerçek ekran görüntüleri ve demo GIF** hazırlanacak.
- Upload akışına MIME / magic-byte kontrolü eklenecek.
- Çoklu worker/deployment gereksinimi doğarsa `Redis` + `Celery/RQ` eklenecek.
- Zaman çizelgesine dalga formu (waveform) ve sürüklenebilir arayüz eklenecek.
