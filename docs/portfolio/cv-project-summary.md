# CV Project Summary: DublajLab

Bu doküman, DublajLab projesinin özgeçmişinizde (CV) nasıl sergilenebileceğine dair farklı uzunluklarda ve dillerde şablonlar içerir.

---

## 1. Kısa Versiyon (Tek Bullet Point - Türkçe)

- **DublajLab (Full-Stack Geliştirici):** Kullanıcıların tarayıcı üzerinden kendi videolarına mikrofonla dublaj yapabildiği web platformu. React ve FastAPI ile geliştirildi, sunucu tarafında FFmpeg kullanılarak asenkron video işleme, JWT tabanlı kimlik doğrulama, topluluk feed'i ve PostgreSQL entegrasyonu sağlandı.

## 2. Uzun Versiyon (Ayrıntılı - Türkçe)

**DublajLab | Kurucu / Full-Stack Geliştirici**  
*(React, TypeScript, FastAPI, PostgreSQL, FFmpeg, Docker)*
- Kullanıcıların kendi videolarına tarayıcı üzerinden (MediaRecorder API) seslendirme yapıp, altyazılı MP4 çıktısı alabildiği bir yaratıcı medya web uygulaması geliştirildi.
- Ağır FFmpeg video miksaj ve işleme görevleri için asenkron Job Polling mimarisi tasarlandı (UI bloklanmadan gerçek zamanlı progress bar).
- JWT tabanlı güvenli kimlik doğrulama, kişisel medya kütüphanesi, Shopier entegrasyonuna hazır VIP yetkilendirme ve public topluluk feed'i (beğeni/yorum) kuruldu.
- Güvenlik ve kaynak yönetimi için Magic-Byte dosya doğrulaması, rate-limit, ve memory/Redis-ready job registry mekanizmaları implemente edildi.
- Vercel ve Railway üzerinde (Docker kullanılarak) deployment gerçekleştirildi.

## 3. English Version (For International CVs)

**DublajLab | Full-Stack Developer**  
*(React, TypeScript, FastAPI, PostgreSQL, FFmpeg, Docker)*
- Built a web-based dubbing studio allowing users to record voice-overs for short videos directly in the browser and export mixed MP4s with burned-in subtitles.
- Architected an asynchronous job polling system in FastAPI to handle heavy FFmpeg sub-processes without blocking the UI.
- Implemented a complete platform experience including JWT-based authentication, a personal media library, a public showcase feed with engagement metrics, and a payments-ready VIP tier.
- Engineered security safeguards including magic-byte file validation, rate-limiting, and an automated background cleanup service for public demo readiness.
- Successfully deployed the static frontend on Vercel and the backend/worker on Railway using Docker.
