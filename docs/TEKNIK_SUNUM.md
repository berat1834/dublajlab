# DublajLab Teknik Sunum ve Mülakat Hazırlığı

Bu doküman, Meme Dublaj Studio MVP projesinin mimari kararlarını, zorluklarını ve çözümlerini LinkedIn, CV ve teknik mülakatlarda profesyonel bir dille ifade edebilmek için hazırlanmıştır.

## CV Highlights / Bullet Points

**English:**
- Architected a distributed AI pipeline by offloading heavy Wav2Lip inference to Modal serverless GPUs, preventing FastAPI out-of-memory errors on 1GB instances and optimizing cloud costs via scale-to-zero compute.
- Developed an asynchronous media processing backend using FastAPI, FFmpeg, and a custom memory-based job registry with progress polling to handle long-running video generation tasks without blocking the event loop.
- Built a secure, timeline-based recording interface with React and TypeScript, mapping hardware microphone chunks precisely to video segments to achieve seamless lip-sync processing.

**Türkçe:**
- Ağır Wav2Lip yapay zeka çıkarım (inference) yükünü Modal serverless GPU'larına dağıtarak, 1GB RAM'li FastAPI sunucularındaki Out-of-Memory (OOM) hatalarını önleyen ve sıfıra ölçeklenebilir (scale-to-zero) yapısıyla maliyetleri optimize eden dağıtık bir AI pipeline mimarisi tasarladım.
- FastAPI, FFmpeg ve bellek içi (in-memory) job registry kullanarak; uzun süren video işleme görevlerini ana event loop'u bloklamadan asenkron yürüten ve progress-polling destekleyen bir medya backend'i geliştirdim.
- React ve TypeScript ile donanımsal mikrofon verisini zaman çizelgesindeki (timeline) video segmentleriyle milisaniye hassasiyetinde eşleştiren güvenli bir ses kayıt arayüzü inşa ettim.

## STAR (Situation, Task, Action, Result) Formatında Mülakat Soruları

### Soru 1: Neden doğrudan FastAPI içinde modeli çalıştırmadın da Serverless GPU'ya geçtin?
- **Situation (Durum):** Video dudak senkronizasyonu (Wav2Lip) için PyTorch tabanlı ağır bir model gerekiyordu. API'mizi barındırdığımız platform (Railway) yalnızca CPU tabanlı ve kısıtlı belleğe (1GB RAM) sahip bir plandaydı.
- **Task (Görev):** Modelin çıkarım (inference) süresini kabul edilebilir seviyelere çekmek ve sunucunun kilitlenip (OOM - Out of Memory) diğer kullanıcıların isteklerini reddetmesini engellemek.
- **Action (Eylem):** Monolitik yapıyı kırarak AI işlemini bağımsız bir Serverless GPU (Modal.com) mikroservisine devrettim (offloading). FastAPI tarafına asenkron bir HTTP webhook yapısı kurdum; böylelikle API sunucusu sadece işi delege edip kendi event loop'unda hafif istekleri (auth, db) yanıtlamaya devam etti.
- **Result (Sonuç):** İşlem süreleri (GPU kullanıldığı için) büyük ölçüde azaldı. API sunucumuz AI işlemleri sırasında çökmedi ve "scale-to-zero" (kullanılmadığında sıfır kaynak) özelliği sayesinde boşta bekleme maliyetleri sıfırlandı.

### Soru 2: Uzun süren AI işlemlerinde (job queue) timeout ve kullanıcı geri bildirimini nasıl yönettin?
- **Situation (Durum):** Medya mixleme (FFmpeg) ve GPU'da dudak senkronizasyonu işlemleri saniyeler (hatta bazen dakikalar) sürdüğü için, standart HTTP istekleri (request-response) timeout'a düşüyordu.
- **Task (Görev):** Kullanıcıyı bekletmeden arka planda işlemleri yürütmek ve frontend'de gerçek zamanlı ilerleme (progress bar) göstermek.
- **Action (Eylem):** `asyncio` kullanarak non-blocking çalışan bir "Job Registry" ve "Polling" sistemi tasarladım. Kullanıcı "Oluştur" dediğinde sistem hemen bir `job_id` döner; asıl işlem arka planda başlatılır (Worker). Frontend her 2 saniyede bir `/api/jobs/{job_id}` rotasına GET isteği atarak işlemin `%` kaçta olduğunu sorgular.
- **Result (Sonuç):** Timeout sorunları tamamen çözüldü. Kullanıcı arayüzünde "Kayıtlar birleştiriliyor (%40)", "AI Modeli bekleniyor (%80)" gibi anlık geri bildirimler görerek UX (Kullanıcı Deneyimi) anlamında pürüzsüz bir akış elde edildi.

### Soru 3: Docker üzerinde FFmpeg ve sistem bağımlılıklarını yönetirken ne gibi zorluklar yaşadın?
- **Situation (Durum):** PyTorch, OpenCV, FFmpeg ve Librosa gibi görüntü/ses işleme kütüphaneleri yalnızca `pip install` ile değil, işletim sistemi seviyesinde kütüphanelere (`libgl1-mesa-glx`, `libglib2.0-0` vb.) ihtiyaç duyuyordu.
- **Task (Görev):** Uygulamanın hem lokalde hem de bulutta (Railway/Modal) tutarlı ve sorunsuz şekilde çalışabileceği bir konteyner ortamı yaratmak.
- **Action (Eylem):** `Dockerfile` dosyasını optimize ettim. Önce sadece gerekli olan APT paketlerini (`apt-get install -y ffmpeg libgl1...`) kurdum. İmaj boyutunu şişirmemek için build layer'larını (Python bağımlılıkları ve OS paketleri) birbirinden ayırdım ve multi-stage build mantığına yakınsadım. Büyük ağırlık dosyalarını (.pth) Git'ten hariç tutarak repoyu temiz tuttum.
- **Result (Sonuç):** Tüm geliştiriciler ve CI/CD pipeline'ı tek bir `docker-compose up` veya Docker build komutuyla ortamı sorunsuz ayağa kaldırabildi. Prodüksiyon ortamındaki eksik "shared library (.so)" hataları sıfırlandı.
