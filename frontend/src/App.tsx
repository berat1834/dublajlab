import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Bot,
  Check,
  CheckCircle2,
  Download,
  Film,
  LoaderCircle,
  Mic2,
  RefreshCw,
  RotateCcw,
  ServerCrash,
  ShieldCheck,
  Sparkles,
  Video,
  WandSparkles,
} from 'lucide-react'
import { TimelineRecorder } from './components/TimelineRecorder'
import { Toggle } from './components/Toggle'
import { UploadZone } from './components/UploadZone'
import { VoiceCards } from './components/VoiceCards'
import {
  absoluteApiUrl,
  processRecordings,
  processVideo,
  uploadVideo,
} from './lib/api'
import type { TimelineLine, UploadResponse, VoiceStyle } from './types'

type Stage = 'idle' | 'uploading' | 'ready' | 'processing' | 'completed'
type DubbingMode = 'my-voice' | 'ai-voice'

interface ErrorDetails {
  title: string
  message: string
  hint: string
  icon: typeof AlertCircle
}

const progressMessages = [
  'Ses kayıtları zaman çizelgesine yerleştiriliyor…',
  'Altyazılar videoya gömülüyor…',
  'Mobil uyumlu MP4 hazırlanıyor…',
]

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function explainError(message: string): ErrorDetails {
  const normalized = message.toLocaleLowerCase('tr-TR')
  if (normalized.includes('sunucuya ulaşılamadı') || normalized.includes('backend')) {
    return {
      title: 'Backend bağlantısı kurulamadı',
      message,
      hint: 'Backend terminalinde sunucunun çalıştığını ve adresin http://localhost:8000 olduğunu kontrol edin.',
      icon: ServerCrash,
    }
  }
  if (normalized.includes('ffmpeg') || normalized.includes('medya işlemi')) {
    return {
      title: 'Medya motoru hazır değil',
      message,
      hint: 'FFmpeg kurulumunu ve PATH ayarını kontrol edin; ardından backend terminalini yeniden başlatın.',
      icon: Film,
    }
  }
  if (normalized.includes('mikrofon') || normalized.includes('izin')) {
    return {
      title: 'Mikrofon erişimi gerekli',
      message,
      hint: 'Adres çubuğundaki kilit simgesinden mikrofon iznini açın ve kayıt düğmesine yeniden basın.',
      icon: Mic2,
    }
  }
  return {
    title: 'İşlem tamamlanamadı',
    message,
    hint: 'Bilgileri kontrol edip tekrar deneyin. Sorun sürerse backend terminalindeki hata mesajına bakın.',
    icon: AlertCircle,
  }
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const retryActionRef = useRef<null | (() => Promise<void>)>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [mode, setMode] = useState<DubbingMode>('my-voice')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [upload, setUpload] = useState<UploadResponse | null>(null)
  const [text, setText] = useState('')
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('dramatic')
  const [muteOriginal, setMuteOriginal] = useState(true)
  const [burnSubtitles, setBurnSubtitles] = useState(true)
  const [outputUrl, setOutputUrl] = useState('')
  const [error, setError] = useState('')
  const [retryLabel, setRetryLabel] = useState('')
  const [progressIndex, setProgressIndex] = useState(0)

  const localPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : ''),
    [selectedFile],
  )
  const errorDetails = useMemo(() => (error ? explainError(error) : null), [error])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl)
    }
  }, [localPreviewUrl])

  useEffect(() => {
    if (stage !== 'processing') return
    const timer = window.setInterval(() => {
      setProgressIndex((current) =>
        Math.min(current + 1, progressMessages.length - 1),
      )
    }, 4500)
    return () => window.clearInterval(timer)
  }, [stage])

  const clearFeedback = () => {
    setError('')
    setRetryLabel('')
    retryActionRef.current = null
  }

  const handleFile = async (file: File) => {
    setSelectedFile(file)
    setUpload(null)
    setOutputUrl('')
    clearFeedback()
    setStage('uploading')
    try {
      const result = await uploadVideo(file)
      setUpload(result)
      setStage('ready')
    } catch (uploadError) {
      setStage('idle')
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : 'Video yüklenirken bir hata oluştu.',
      )
      retryActionRef.current = () => handleFile(file)
      setRetryLabel('Yüklemeyi tekrar dene')
    }
  }

  const beginProcessing = () => {
    setError('')
    setRetryLabel('')
    retryActionRef.current = null
    setOutputUrl('')
    setProgressIndex(0)
    setStage('processing')
  }

  const completeProcessing = (downloadUrl: string) => {
    setOutputUrl(absoluteApiUrl(downloadUrl))
    setStage('completed')
  }

  const failProcessing = (
    processError: unknown,
    retryAction: () => Promise<void>,
  ) => {
    setStage('ready')
    setError(
      processError instanceof Error
        ? processError.message
        : 'Video işlenirken bir hata oluştu.',
    )
    retryActionRef.current = retryAction
    setRetryLabel('Export’u tekrar dene')
  }

  const handleRecordingProcess = async (
    lines: TimelineLine[],
    recordings: Map<string, Blob>,
    muteOriginalAudio: boolean,
    shouldBurnSubtitles: boolean,
  ) => {
    if (!upload) return
    const retry = () =>
      handleRecordingProcess(
        lines,
        recordings,
        muteOriginalAudio,
        shouldBurnSubtitles,
      )
    beginProcessing()
    try {
      const result = await processRecordings({
        videoId: upload.video_id,
        timeline: lines,
        recordings,
        muteOriginalAudio,
        burnSubtitles: shouldBurnSubtitles,
      })
      completeProcessing(result.download_url)
    } catch (processError) {
      failProcessing(processError, retry)
    }
  }

  const handleAiProcess = async () => {
    if (!upload) {
      setError('Önce bir video yükleyin.')
      return
    }
    if (!text.trim()) {
      setError('Dublaj metni boş bırakılamaz.')
      return
    }
    const retry = () => handleAiProcess()
    beginProcessing()
    try {
      const result = await processVideo({
        video_id: upload.video_id,
        text: text.trim(),
        voice_style: voiceStyle,
        mute_original_audio: muteOriginal,
        burn_subtitles: burnSubtitles,
      })
      completeProcessing(result.download_url)
    } catch (processError) {
      failProcessing(processError, retry)
    }
  }

  const reset = () => {
    setStage('idle')
    setSelectedFile(null)
    setUpload(null)
    setText('')
    setOutputUrl('')
    setProgressIndex(0)
    clearFeedback()
  }

  const retrySameVideo = () => {
    setStage('ready')
    setOutputUrl('')
    clearFeedback()
    window.requestAnimationFrame(() => {
      videoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const showEditorError = (message: string) => {
    setError(message)
    if (message) {
      setRetryLabel('')
      retryActionRef.current = null
    }
  }

  const busy = stage === 'uploading' || stage === 'processing'
  const inputPreview = upload
    ? absoluteApiUrl(upload.preview_url)
    : localPreviewUrl

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:py-10">
      <div className="mx-auto max-w-[1440px]">
        <header className="mb-7 border-b border-white/10 pb-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
                <Sparkles className="h-3.5 w-3.5" /> Kendi sesinle dublaj stüdyosu
              </div>
              <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">
                Dublaj<span className="text-lime">Lab</span>
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Videonu yükle, sahneleri kendi sesinle canlandır ve paylaşmaya hazır
                MP4’ünü birkaç adımda oluştur.
              </p>
            </div>
            <ol className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-panel/80 text-xs">
              {[
                ['1', 'Videoyu yükle', Boolean(upload)],
                ['2', 'Replikleri kaydet', stage === 'processing' || stage === 'completed'],
                ['3', 'MP4’ü indir', stage === 'completed'],
              ].map(([number, label, complete], index) => (
                <li
                  key={String(number)}
                  className={`flex items-center gap-2 px-3 py-3 sm:px-4 ${index ? 'border-l border-white/10' : ''}`}
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-bold ${complete ? 'bg-lime text-ink' : 'bg-white/5 text-zinc-500'}`}>
                    {complete ? <Check className="h-3.5 w-3.5" /> : number}
                  </span>
                  <span className="hidden whitespace-nowrap text-zinc-400 sm:block">{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </header>

        {errorDetails && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-4 rounded-2xl border border-red-400/20 bg-red-400/[0.08] p-4 sm:flex-row sm:items-center"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-400/10 text-red-300">
              <errorDetails.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-red-200">{errorDetails.title}</p>
              <p className="mt-1 text-sm text-red-100/90">{errorDetails.message}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{errorDetails.hint}</p>
            </div>
            {retryLabel && (
              <button
                type="button"
                onClick={() => void retryActionRef.current?.()}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-300/10 px-4 py-2.5 text-xs font-bold text-red-100 transition hover:bg-red-300/15"
              >
                <RefreshCw className="h-3.5 w-3.5" /> {retryLabel}
              </button>
            )}
          </div>
        )}

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="h-fit rounded-2xl border border-white/10 bg-panel/95 p-4 shadow-2xl shadow-black/25 sm:p-5 lg:sticky lg:top-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  01 / Kaynak video
                </p>
                <h2 className="mt-1 text-xl font-bold">Sahneni seç</h2>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Videoyu değiştir
                </button>
              )}
            </div>

            {!selectedFile ? (
              <UploadZone onFile={handleFile} disabled={busy} />
            ) : (
              <div>
                <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    key={inputPreview}
                    className="aspect-video w-full object-contain"
                    src={inputPreview}
                    controls
                    playsInline
                  />
                  {stage === 'uploading' && (
                    <div className="absolute inset-0 grid place-items-center bg-black/70 backdrop-blur-sm">
                      <div className="text-center">
                        <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-lime" />
                        <p className="mt-3 text-sm font-semibold text-white">Video doğrulanıyor</p>
                        <p className="mt-1 text-xs text-zinc-500">Süre ve format kontrol ediliyor…</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs">
                  <span className="min-w-0 truncate font-medium text-zinc-300">
                    {selectedFile.name}
                  </span>
                  <span className="shrink-0 text-zinc-600">
                    {upload
                      ? `${upload.duration_seconds.toFixed(1)} sn · ${formatBytes(upload.size_bytes)}`
                      : formatBytes(selectedFile.size)}
                  </span>
                </div>
                {upload && stage !== 'uploading' && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2.5 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Video kullanıma hazır
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-panel/95 p-4 shadow-2xl shadow-black/25 sm:p-5">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  02 / Dublaj
                </p>
                <h2 className="mt-1 text-xl font-bold">Sahneyi seslendir</h2>
              </div>
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('my-voice')
                    clearFeedback()
                  }}
                  disabled={busy}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === 'my-voice' ? 'bg-lime text-ink' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Mic2 className="h-3.5 w-3.5" /> Kendi sesim
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('ai-voice')
                    clearFeedback()
                  }}
                  disabled={busy}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === 'ai-voice' ? 'bg-violet text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Bot className="h-3.5 w-3.5" /> AI ses
                </button>
              </div>
            </div>

            {!upload ? (
              <div className="grid min-h-80 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
                <div className="max-w-sm">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-600">
                    <Video className="h-7 w-7" />
                  </span>
                  <p className="mt-4 font-bold text-zinc-300">Önce videonu yükle</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    Video hazır olduğunda replik zaman çizelgesi burada otomatik oluşacak.
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-[11px] text-zinc-600">
                    <span className="rounded-lg bg-white/[0.03] px-2 py-2">Metni düzenle</span>
                    <span className="rounded-lg bg-white/[0.03] px-2 py-2">Sesini kaydet</span>
                    <span className="rounded-lg bg-white/[0.03] px-2 py-2">MP4 oluştur</span>
                  </div>
                </div>
              </div>
            ) : mode === 'my-voice' ? (
              <TimelineRecorder
                key={upload.video_id}
                duration={upload.duration_seconds}
                videoRef={videoRef}
                disabled={busy}
                onError={showEditorError}
                onProcess={handleRecordingProcess}
              />
            ) : (
              <div>
                <div className="mb-4 rounded-xl border border-violet/20 bg-violet/5 p-3 text-xs leading-5 text-zinc-400">
                  Opsiyonel mod: Yazdığın metin, gerçek kişileri taklit etmeyen hazır bir
                  Türkçe yapay sesle okunur.
                </div>
                <label htmlFor="script" className="text-sm font-semibold text-zinc-200">
                  Dublaj metni
                </label>
                <div className="relative mt-3">
                  <textarea
                    id="script"
                    rows={5}
                    value={text}
                    maxLength={500}
                    disabled={busy}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Örn: Toplantı beş dakika sürecek dediklerinde ben…"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 pb-9 text-sm leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-violet/50 focus:ring-2 focus:ring-violet/10 disabled:opacity-60"
                  />
                  <span className={`absolute bottom-3 right-3 text-xs tabular-nums ${text.length >= 450 ? 'text-amber-300' : 'text-zinc-600'}`}>
                    {text.length} / 500
                  </span>
                </div>
                <div className="mt-5">
                  <VoiceCards value={voiceStyle} onChange={setVoiceStyle} disabled={busy} />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Toggle
                    checked={muteOriginal}
                    onChange={setMuteOriginal}
                    label="Orijinal sesi kıs"
                    description="AI dublajı öne çıkarır"
                    disabled={busy}
                  />
                  <Toggle
                    checked={burnSubtitles}
                    onChange={setBurnSubtitles}
                    label="Altyazıyı göm"
                    description="Metni videoda gösterir"
                    disabled={busy}
                  />
                </div>
                <button
                  type="button"
                  disabled={!text.trim() || busy}
                  onClick={() => void handleAiProcess()}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-violet/90 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
                >
                  <WandSparkles className="h-5 w-5" /> AI Sesle Video Oluştur
                </button>
                {!text.trim() && (
                  <p className="mt-2 text-center text-xs text-zinc-600">
                    Devam etmek için dublaj metnini yazın.
                  </p>
                )}
              </div>
            )}

            {stage === 'processing' && (
              <div className="mt-4 rounded-xl border border-lime/20 bg-lime/5 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-lime/60">
                  Tahmini işlem adımı
                </p>
                <div className="flex items-center gap-3 text-sm font-semibold text-lime">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  {progressMessages[progressIndex]}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-lime transition-all duration-700"
                    style={{ width: `${35 + progressIndex * 30}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-600">Bu sırada sayfayı kapatmayın.</p>
              </div>
            )}
          </section>
        </div>

        {outputUrl && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-lime/25 bg-panel/95 shadow-glow">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime text-ink">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">
                    03 / Export hazır
                  </p>
                  <h2 className="mt-1 text-xl font-bold">Dublajın paylaşılmaya hazır.</h2>
                </div>
              </div>
              <a
                href={outputUrl}
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink transition hover:bg-[#d5ff78]"
              >
                <Download className="h-4 w-4" /> MP4 indir
              </a>
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="bg-black p-3 sm:p-5">
                <video
                  className="mx-auto max-h-[70vh] w-full rounded-xl object-contain"
                  src={outputUrl}
                  controls
                  playsInline
                />
              </div>
              <div className="flex flex-col justify-center gap-3 border-t border-white/10 p-4 lg:border-l lg:border-t-0 lg:p-5">
                <p className="text-sm font-bold text-white">Sırada ne var?</p>
                <p className="text-xs leading-5 text-zinc-500">
                  Sonucu indirebilir, kayıtları koruyarak tekrar düzenleyebilir veya yeni bir projeye başlayabilirsin.
                </p>
                <button
                  type="button"
                  onClick={retrySameVideo}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold text-zinc-200 transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" /> Aynı video ile yeniden dene
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-xs font-bold text-zinc-400 transition hover:border-white/20 hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" /> Yeni video ile başla
                </button>
              </div>
            </div>
          </section>
        )}

        <aside className="mt-5 flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-xs leading-5 text-zinc-500">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
          <p>
            Bu uygulama eğlence, parodi ve portföy amaçlıdır. Gerçek kişileri taklit
            etmek, yanıltıcı içerik üretmek veya telifli içerikleri izinsiz dağıtmak
            kullanıcının sorumluluğundadır. Mikrofon kayıtları yalnızca video işlenirken
            kullanılır ve işlem sonrası geçici sunucu kopyaları silinir.
          </p>
        </aside>

        <footer className="py-8 text-center text-xs text-zinc-700">
          Kendi videonu kullan · Kimseyi taklit etme · Kendi sesinle üret
        </footer>
      </div>
    </main>
  )
}

export default App
