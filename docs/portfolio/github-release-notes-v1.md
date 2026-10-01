# DublajLab v1.0.0-beta - Public Beta Release 🚀

Welcome to the first public beta release of **DublajLab**! This MVP represents a complete end-to-end production flow for creating dubbed videos in your browser.

## 🎯 Highlights
- **Browser-based Studio:** Upload short videos (up to 60s) or choose from templates, adjust dialogue timelines visually, and record your voice-over directly via the browser.
- **Asynchronous Audio Mixing:** Recordings are sent to a FastAPI backend where FFmpeg mixes them with the original video (while ducking original audio) and burns in subtitles without blocking the UI.
- **Personal & Public Library:** JWT/PostgreSQL powered backend enables user accounts, a personal library (`Kataloğum`), and a public showcase feed for community interactions (views, likes, comments).
- **VIP/Premium Ready:** Built-in membership tier architecture for high-quality exports with a webhook-ready structure (Shopier).
- **Responsive & Modern UI:** A beautiful dark-themed interface built with React, Vite, and Tailwind CSS.

## 🏗 Architecture
- **Backend:** Python 3.11, FastAPI, Pydantic, FFmpeg sub-processing.
- **Frontend:** React 18, TypeScript, Tailwind CSS.
- **State Management:** Memory Job Registry with polling (Redis/Celery ready).
- **Deployment:** Vercel (Static Frontend) & Railway (Dockerized FastAPI with Persistent Volume).

## 🔒 Security & Limits
- **Magic-Byte Validation:** Strict file type checking on uploads to prevent malicious files.
- **Public Demo Limits:** Enforced restrictions on file size (20MB), duration (30s), and daily exports (5/day) per IP to prevent abuse.
- **Retention Policy:** Automated background cleanup for processed outputs.

## ⚠️ Known Limitations
- Storage defaults to the local filesystem (Railway Volume). Cloudflare R2 / AWS S3 integration is implemented but requires valid provider credentials to activate.
- Shopier payment integration is disabled until valid API keys are configured by the admin.
- Experimental Lip-Sync (Wav2Lip) is disabled by default due to open-source licensing restrictions for commercial/public beta usage.

## 🚀 Next Steps
- Implement AI content scanning / automated toxicity filtering for the public feed.
- Migrate the memory job registry to a dedicated Redis instance for multi-worker scaling.
- Gather user feedback during the beta phase for UX improvements!
