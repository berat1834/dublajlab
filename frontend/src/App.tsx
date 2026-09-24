import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Download,
  Film,
  LoaderCircle,
  Mic2,
  RotateCcw,
  ShieldCheck,
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

const progressMessages = [
  'Ses kayıtları zaman çizelgesine yerleştiriliyor…',
  'Altyazılar videoya gömülüyor…',
  'Mobil uyumlu MP4 hazırlanıyor…',
]

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
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
  const [progressIndex, setProgressIndex] = useState(0)

  const localPreviewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : ''),
    [selectedFile],
  )

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

  const handleFile = async (file: File) => {
    setSelectedFile(file)
    setUpload(null)
    setOutputUrl('')
    setError('')
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
    }
  }

  const beginProcessing = () => {
    setError('')
    setOutputUrl('')
    setProgressIndex(0)
    setStage('processing')
  }

  const completeProcessing = (downloadUrl: string) => {
    setOutputUrl(absoluteApiUrl(downloadUrl))
    setStage('completed')
  }

  const failProcessing = (processError: unknown) => {
    setStage('ready')
    setError(
      processError instanceof Error
        ? processError.message
        : 'Video işlenirken bir hata oluştu.',
    )
  }

  const handleRecordingProcess = async (
    lines: TimelineLine[],
    recordings: Map<string, Blob>,
    muteOriginalAudio: boolean,
    shouldBurnSubtitles: boolean,
  ) => {
    if (!upload) return
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
      failProcessing(processError)
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
      failProcessing(processError)
    }
  }

  const reset = () => {
    setStage('idle')
    setSelectedFile(null)
    setUpload(null)
    setText('')
    setOutputUrl('')
    setError('')
    setProgressIndex(0)
  }

  const busy = stage === 'uploading' || stage === 'processing'
  const inputPreview = upload
    ? absoluteApiUrl(upload.preview_url)
    : localPreviewUrl

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 flex flex-col justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-end">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
              <Film className="h-3.5 w-3.5" /> AI Creator Tools · Faz 1
            </div>
            <h1 className="text-4xl font-extrabold tracking-[-0.045em] text-white sm:text-5xl">
              Dublaj<span className="text-lime">Lab</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
              Videoyu izle, replikleri kendi sesinle kaydet; zamanlanmış dublajlı ve
              altyazılı MP4’ünü indir.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-lime shadow-[0_0_10px_#c7f464]" />
            Kendi sesinle dublaj · v0.2.0
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <section className="h-fit rounded-2xl border border-white/10 bg-panel/95 p-4 shadow-2xl shadow-black/25 sm:p-5 lg:sticky lg:top-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  01 / Kaynak
                </p>
                <h2 className="mt-1 text-lg font-bold">Video yükle</h2>
              </div>
              {selectedFile && (
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Değiştir
                </button>
              )}
            </div>

            {!selectedFile ? (
              <UploadZone onFile={handleFile} disabled={busy} />
            ) : (
              <div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                  <video
                    ref={videoRef}
                    key={inputPreview}
                    className="aspect-video w-full object-contain"
                    src={inputPreview}
                    controls
                    playsInline
                  />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 text-xs">
                  <span className="min-w-0 truncate font-medium text-zinc-300">
                    {selectedFile.name}
                  </span>
                  <span className="shrink-0 text-zinc-600">
                    {upload
                      ? `${upload.duration_seconds.toFixed(1)} sn · ${formatBytes(upload.size_bytes)}`
                      : formatBytes(selectedFile.size)}
                  </span>
                </div>
                {stage === 'uploading' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-lime">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Video doğrulanıyor…
                  </div>
                )}
                {upload && stage !== 'uploading' && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
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
                <h2 className="mt-1 text-lg font-bold">Sahneyi seslendir</h2>
              </div>
              <div className="grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setMode('my-voice')}
                  disabled={busy}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === 'my-voice' ? 'bg-lime text-ink' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Mic2 className="h-3.5 w-3.5" /> Kendi sesim
                </button>
                <button
                  type="button"
                  onClick={() => setMode('ai-voice')}
                  disabled={busy}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === 'ai-voice' ? 'bg-violet text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Bot className="h-3.5 w-3.5" /> AI ses
                </button>
              </div>
            </div>

            {!upload ? (
              <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
                <div>
                  <Mic2 className="mx-auto h-8 w-8 text-zinc-700" />
                  <p className="mt-3 text-sm font-semibold text-zinc-400">
                    Replikleri hazırlamak için önce videonu yükle.
                  </p>
                </div>
              </div>
            ) : mode === 'my-voice' ? (
              <TimelineRecorder
                key={upload.video_id}
                duration={upload.duration_seconds}
                videoRef={videoRef}
                disabled={busy}
                onError={setError}
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
              </div>
            )}

            {stage === 'processing' && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-lime/20 bg-lime/5 p-3 text-xs font-semibold text-lime">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {progressMessages[progressIndex]}
              </div>
            )}
          </section>
        </div>

        {outputUrl && (
          <section className="mt-5 rounded-2xl border border-lime/20 bg-panel/95 p-4 shadow-glow sm:p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime">
                  03 / Hazır
                </p>
                <h2 className="mt-1 text-xl font-bold">Dublajın yayına hazır.</h2>
              </div>
              <a
                href={outputUrl}
                download
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-zinc-200"
              >
                <Download className="h-4 w-4" /> MP4 indir
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <video
                className="mx-auto max-h-[70vh] w-full object-contain"
                src={outputUrl}
                controls
                playsInline
              />
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
