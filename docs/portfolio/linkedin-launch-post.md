# LinkedIn Launch Post: DublajLab (Public Beta)

🚀 Hey everyone! Bir süredir üzerinde çalıştığım ve teknik kaslarımı zorlayan "DublajLab" projesini sonunda Public Beta olarak yayına aldım! 🎙️

**Peki nedir bu DublajLab?**
DublajLab, kısa videolarınızı tarayıcı üzerinden kendi sesinizle yeniden seslendirmenizi (dublaj) sağlayan web tabanlı bir stüdyo. Orijinal sesi kısıp mikrofon kayıtlarınızı timeline üzerinde video ile birleştiriyor ve size altyazılı bir MP4 sunuyor.

**💻 Kullanılan Teknolojiler (Tech Stack):**
• Backend: Python, FastAPI, Pydantic, FFmpeg & FFprobe (Video Processing)
• Frontend: React 18, TypeScript, Vite, Tailwind CSS
• Database & Auth: PostgreSQL, JWT-based Authentication
• Architecture: Asynchronous Job Polling, Memory Job Registry (Redis-ready)
• Deployment: Vercel (Frontend) & Railway (Docker Backend & Volume)

**💡 Bu projeden neler öğrendim?**
Bu proje sadece bir React uygulaması değil, tam anlamıyla uçtan uca bir prodüksiyon deneyimiydi:
- Tarayıcı üzerinden mikrofon verisini `MediaRecorder` API ile yakalayıp asenkron yönetmek.
- Sunucu tarafında ağır `FFmpeg` süreçlerini (trim, mix, altyazı) uygulamanın UI'ını bloklamadan (job polling) arka planda koşturmak.
- Public bir demo ortamının güvenlik ve kota sınırlarını tasarlamak (rate-limiting, file magic-byte validation).

Şu an MVP temel özellikleri ile stabil ve test edilebilir durumda. 

👉 **Live Demo:** [https://dublajlab-sigma.vercel.app](https://dublajlab-sigma.vercel.app)
*(Tarayıcınızdan mikrofon izni vererek kendi videolarınıza dublaj yapmayı deneyebilirsiniz!)*

👉 **GitHub Repo:** [https://github.com/berat1834/dublajlab](https://github.com/berat1834/dublajlab)
*(Kodları incelemek ve teknik mimariye göz atmak isterseniz)*

Tüm geri bildirimleriniz benim için çok değerli! Yorumlarda düşüncelerinizi paylaşabilirsiniz. 👇

#React #FastAPI #Python #TypeScript #FFmpeg #WebDevelopment #SoftwareEngineering #Frontend #Backend
