import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  Film,
  Layers,
  LoaderCircle,
  Mic2,
  Play,
  RefreshCw,
  RotateCcw,
  ServerCrash,
  ShieldCheck,
  Sparkles,
  Subtitles,
  Video,
  WandSparkles,
  Info
} from 'lucide-react'
import { TimelineRecorder } from './components/TimelineRecorder'
import { TemplateGallery } from './components/TemplateGallery'
import { Toggle } from './components/Toggle'
import { UploadZone } from './components/UploadZone'
import { VoiceCards } from './components/VoiceCards'
import { PlatformNavbar } from './components/PlatformNavbar'
import { PlatformFooter } from './components/PlatformFooter'
import { HowToModal } from './components/HowToModal'
import { ShowcaseDubs } from './components/ShowcaseDubs'
import { DailyDub } from './components/DailyDub'
import { EthicsNotice } from './components/EthicsNotice'
import { SceneDetail } from './components/SceneDetail'
import { AuthPage } from './components/AuthPage'
import {
  absoluteApiUrl,
  fetchDemoPolicy,
  fetchTemplate,
  processRecordings,
  processVideo,
  uploadVideo,
  waitForJobCompletion,
} from './lib/api'
import type {
  DemoPolicy,
  Tab,
  JobResponse,
  TimelineLine,
  UploadResponse,
  VideoTemplate,
  VoiceStyle,
} from './types'

type Stage = 'idle' | 'uploading' | 'ready' | 'processing' | 'completed'
type DubbingMode = 'my-voice' | 'ai-voice'
type SourceMode = 'upload' | 'templates'

interface ErrorDetails {
  title: string
  message: string
  hint: string
  icon: typeof AlertCircle
}

function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function templateAssetUrl(path: string) {
  return path.startsWith('http://') || path.startsWith('https://')
    ? path
    : path.startsWith('/')
      ? path
      : `/${path}`
}

function templateFilename(template: VideoTemplate) {
  const extension = template.video_url?.split(/[?#]/)[0].match(/\.(mp4|mov|webm)$/i)?.[0]
  return `${template.id}${extension ?? '.mp4'}`
}

function explainError(message: string): ErrorDetails {
  const normalized = message.toLocaleLowerCase('tr-TR')
  if (normalized.includes('günlük export sınırı') || normalized.includes('çok fazla istek')) {
    return {
      title: 'Günlük demo limiti doldu',
      message,
      hint: 'Public demo kotası UTC gün başlangıcında yenilenir. Daha sonra tekrar deneyin.',
      icon: ShieldCheck,
    }
  }
  if (
    normalized.includes('en fazla')
    && (normalized.includes('mb') || normalized.includes('saniye'))
  ) {
    return {
      title: 'Public demo limiti aşıldı',
      message,
      hint: 'Daha küçük veya daha kısa bir video/kayıt seçip yeniden deneyin.',
      icon: AlertCircle,
    }
  }
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

/* ── Mock preview lines used in the hero & empty editor state ── */
const MOCK_LINES = [
  { text: 'Toplantı beş dakika sürecek dediler…', time: '0:00 – 0:03' },
  { text: 'Tüm gün süren o toplantı…', time: '0:03 – 0:06' },
  { text: 'Neyse, kahve molası…', time: '0:06 – 0:09' },
]

/* ── Feature strip items ── */
const FEATURES = [
  { icon: Mic2, label: 'Kendi sesim' },
  { icon: Layers, label: 'Timeline replik' },
  { icon: Video, label: 'MP4 export' },
  { icon: Subtitles, label: 'Altyazı gömme' },
  { icon: ShieldCheck, label: 'Telif bilinci' },
] as const

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const retryActionRef = useRef<null | (() => Promise<void>)>(null)
  const activeJobControllerRef = useRef<AbortController | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [mode, setMode] = useState<DubbingMode>('my-voice')
  const [sourceMode, setSourceMode] = useState<SourceMode>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [upload, setUpload] = useState<UploadResponse | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null)
  const [selectingTemplateId, setSelectingTemplateId] = useState('')
  const [text, setText] = useState('')
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle>('dramatic')
  const [muteOriginal, setMuteOriginal] = useState(true)
  const [burnSubtitles, setBurnSubtitles] = useState(true)
  const [outputUrl, setOutputUrl] = useState('')
  const [error, setError] = useState('')
  const [retryLabel, setRetryLabel] = useState('')
  const [jobProgress, setJobProgress] = useState(0)
  const [jobMessage, setJobMessage] = useState('')
  const [demoPolicy, setDemoPolicy] = useState<DemoPolicy | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('play')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [showHowTo, setShowHowTo] = useState(false)
  const [detailTemplateId, setDetailTemplateId] = useState<string | null>(null)

  const handleLegalLink = () => {
    setToastMessage('Bu sayfa (Gizlilik/Şartlar) canlı yayın öncesi profesyonel metinlerle güncellenecektir.')
    setTimeout(() => setToastMessage(''), 4000)
  }

  const handleFeatureSoon = () => {
    setToastMessage('Bu özellik canlı demo sonrasında eklenecek.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleTabTemplateSelect = (templateId: string) => {
    setDetailTemplateId(templateId);
    setActiveTab('scene_detail');
  }

  const handlePlayFromDetail = (templateId: string) => {
    setActiveTab('play');
    void handleTemplateSelect(templateId);
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

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
    return () => activeJobControllerRef.current?.abort()
  }, [])

  useEffect(() => {
    let active = true
    void fetchDemoPolicy()
      .then((policy) => {
        if (active) setDemoPolicy(policy)
      })
      .catch(() => {
        // Upload/process requests already surface backend connectivity errors.
      })
    return () => {
      active = false
    }
  }, [])

  const clearFeedback = () => {
    setError('')
    setRetryLabel('')
    retryActionRef.current = null
  }

  const handleFile = async (file: File) => {
    setSourceMode('upload')
    setSelectedTemplate(null)
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

  const handleTemplateSelect = async (templateId: string) => {
    clearFeedback()
    setSelectingTemplateId(templateId)
    setOutputUrl('')
    let loadedTemplate: VideoTemplate | null = null
    try {
      const template = await fetchTemplate(templateId)
      loadedTemplate = template
      setSelectedTemplate(template)
      setSelectedFile(null)
      setUpload(null)
      setMode('my-voice')
      if (template.video_url) {
        setStage('uploading')
        const mediaResponse = await fetch(templateAssetUrl(template.video_url))
        if (!mediaResponse.ok) {
          throw new Error('Template video dosyası yüklenemedi. Dosya yolunu ve lisans metadata\u2019sını kontrol edin.')
        }
        const mediaBlob = await mediaResponse.blob()
        const mediaFile = new File([mediaBlob], templateFilename(template), {
          type: mediaBlob.type || 'video/mp4',
        })
        setSelectedFile(mediaFile)
        setUpload(await uploadVideo(mediaFile))
      }
      setStage('ready')
    } catch (templateError) {
      setStage(loadedTemplate ? 'ready' : 'idle')
      setError(
        templateError instanceof Error
          ? templateError.message
          : 'Hazır sahne açılamadı.',
      )
    } finally {
      setSelectingTemplateId('')
    }
  }

  const beginProcessing = () => {
    activeJobControllerRef.current?.abort()
    activeJobControllerRef.current = null
    setError('')
    setRetryLabel('')
    retryActionRef.current = null
    setOutputUrl('')
    setJobProgress(0)
    setJobMessage('Export isteği hazırlanıyor.')
    setStage('processing')
  }

  const completeProcessing = (downloadUrl: string) => {
    setJobProgress(100)
    setJobMessage('Dublaj videosu hazır.')
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
    setRetryLabel('Export\u2019u tekrar dene')
  }

  const monitorJob = async (createdJob: JobResponse): Promise<JobResponse> => {
    const controller = new AbortController()
    activeJobControllerRef.current = controller
    setJobProgress(createdJob.progress)
    setJobMessage(createdJob.message)
    try {
      return await waitForJobCompletion(
        createdJob.job_id,
        (job) => {
          setJobProgress(job.progress)
          setJobMessage(job.message)
        },
        controller.signal,
      )
    } finally {
      if (activeJobControllerRef.current === controller) {
        activeJobControllerRef.current = null
      }
    }
  }

  const isPollingAbort = (value: unknown) =>
    value instanceof DOMException && value.name === 'AbortError'

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
      const createdJob = await processRecordings({
        videoId: upload.video_id,
        timeline: lines,
        recordings,
        muteOriginalAudio,
        burnSubtitles: shouldBurnSubtitles,
      })
      const completedJob = await monitorJob(createdJob)
      if (!completedJob.download_url) {
        throw new Error('Job tamamlandı ancak çıktı bağlantısı alınamadı.')
      }
      completeProcessing(completedJob.download_url)
    } catch (processError) {
      if (isPollingAbort(processError)) return
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
      const createdJob = await processVideo({
        video_id: upload.video_id,
        text: text.trim(),
        voice_style: voiceStyle,
        mute_original_audio: muteOriginal,
        burn_subtitles: burnSubtitles,
      })
      const completedJob = await monitorJob(createdJob)
      if (!completedJob.download_url) {
        throw new Error('Job tamamlandı ancak çıktı bağlantısı alınamadı.')
      }
      completeProcessing(completedJob.download_url)
    } catch (processError) {
      if (isPollingAbort(processError)) return
      failProcessing(processError, retry)
    }
  }

  const reset = () => {
    activeJobControllerRef.current?.abort()
    activeJobControllerRef.current = null
    setStage('idle')
    setSourceMode('upload')
    setSelectedFile(null)
    setUpload(null)
    setSelectedTemplate(null)
    setSelectingTemplateId('')
    setText('')
    setOutputUrl('')
    setJobProgress(0)
    setJobMessage('')
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

  const showEditorError = useCallback((message: string) => {
    setError(message)
    if (message) {
      setRetryLabel('')
      retryActionRef.current = null
    }
  }, [])

  const changeSourceMode = (nextMode: SourceMode) => {
    if (sourceMode === nextMode) return
    reset()
    setSourceMode(nextMode)
  }

  const busy = stage === 'uploading' || stage === 'processing'
  const templatePreviewUrl = selectedTemplate?.video_url
    ? templateAssetUrl(selectedTemplate.video_url)
    : ''
  const inputPreview = upload
    ? absoluteApiUrl(upload.preview_url)
    : templatePreviewUrl || localPreviewUrl
  const projectReady = Boolean(upload || selectedTemplate)

  return (
    <div className="flex min-h-screen flex-col">
      {/* NAVBAR */}
      <PlatformNavbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        handleFeatureSoon={handleFeatureSoon} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full border border-violet/30 bg-violet text-white px-4 py-2 text-sm font-medium shadow-glow animate-in fade-in slide-in-from-bottom-4">
          <Info className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          {activeTab === 'play' ? (
            <>
        {/* ═══════════════════════════ HERO SECTION ═══════════════════════════ */}
        <header className="mb-8 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-lime/20 bg-lime/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-lime">
                <Sparkles className="h-3.5 w-3.5" /> Tarayıcı tabanlı dublaj stüdyosu
              </div>
              <h1 className="break-words text-[1.85rem] font-black leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl sm:tracking-[-0.04em] lg:text-[3.4rem]">
                Kendi sesinle komik
                <br className="hidden sm:block" />{' '}
                <span className="bg-gradient-to-r from-lime via-lime to-emerald-300 bg-clip-text text-transparent">
                  dublaj videoları
                </span>{' '}
                oluştur
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400 sm:text-lg">
                Hazır sahne seç ya da kendi videonu yükle, repliği oku,{' '}
                <span className="font-semibold text-zinc-300">altyazılı MP4</span> olarak indir.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => changeSourceMode('templates')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink shadow-glow transition hover:bg-[#d5ff78] sm:w-auto"
                >
                  <Play className="h-4 w-4" /> Hazır sahne ile başla
                </button>
                <button
                  type="button"
                  onClick={() => changeSourceMode('upload')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10 sm:w-auto"
                >
                  Kendi videonu yükle <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Çok Oyunculu Dublaj</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleFeatureSoon} className="inline-flex items-center gap-2 rounded-xl bg-violet/15 px-4 py-2.5 text-sm font-bold text-violet transition hover:bg-violet/25">Oda kur</button>
                  <button onClick={handleFeatureSoon} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-white/10">Oda koduyla katıl</button>
                </div>
              </div>
            </div>

            {/* ── Steps indicator + mock preview ── */}
            <div className="flex w-full flex-col items-stretch gap-4 lg:w-auto lg:items-end">
              <ol className="grid w-full grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-panel/80 text-xs lg:w-auto">
                {[
                  ['1', 'Sahneyi seç', projectReady],
                  ['2', 'Replikleri kaydet', stage === 'processing' || stage === 'completed'],
                  ['3', 'MP4\u2019ü indir', stage === 'completed'],
                ].map(([number, label, complete], index) => (
                  <li
                    key={String(number)}
                    className={`flex min-w-0 flex-col items-center justify-center gap-1.5 overflow-hidden px-1.5 py-3 text-center sm:flex-row sm:gap-2 sm:px-4 ${index ? 'border-l border-white/10' : ''}`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full font-bold ${complete ? 'bg-lime text-ink' : 'bg-white/5 text-zinc-500'}`}>
                      {complete ? <Check className="h-3.5 w-3.5" /> : number}
                    </span>
                    <span className="w-full break-words text-[10px] leading-3 text-zinc-400 sm:w-auto sm:whitespace-nowrap sm:text-xs sm:leading-normal">{label as string}</span>
                  </li>
                ))}
              </ol>

              {/* Mock preview card — visible only before source is chosen */}
              {!projectReady && stage === 'idle' && (
                <div className="w-full max-w-sm self-center overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-card lg:w-72 lg:self-auto">
                  <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-12 w-12 rounded-full border-2 border-lime/30 bg-lime/10 grid place-items-center">
                        <Play className="h-5 w-5 text-lime" />
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-[10px] font-bold text-lime">Çıktı örneği</p>
                      <p className="text-[10px] text-zinc-400">Repliğini oku → MP4 indir</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 p-3">
                    {MOCK_LINES.map((line, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-violet/15 text-[9px] font-bold text-violet">
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[10px] text-zinc-400">{line.text}</span>
                        <span className="shrink-0 text-[9px] tabular-nums text-zinc-500">{line.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══════════════════════════ FEATURE STRIP ═══════════════════════════ */}
        <div className="mb-6 flex flex-wrap justify-center gap-2 sm:gap-3">
          {FEATURES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="feature-strip-item inline-flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-2 text-xs font-semibold text-zinc-400 transition hover:border-white/15 hover:text-zinc-200"
            >
              <Icon className="h-3.5 w-3.5 text-lime" /> {label}
            </span>
          ))}
        </div>

        {/* ═══════════════════════════ DEMO POLICY BANNER ═══════════════════════════ */}
        {demoPolicy?.enabled && (
          <aside className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-50">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <p className="font-bold">Public demo sınırları etkin</p>
              <p className="mt-1 leading-6 text-zinc-400">
                En fazla {demoPolicy.max_file_size_mb} MB / {demoPolicy.max_video_duration_seconds} saniye video,
                replik başına {demoPolicy.max_recording_size_mb} MB kayıt ve IP başına günde{' '}
                {demoPolicy.max_exports_per_ip_per_day} export kullanılabilir.
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-200/80">
                Bu public demo dosyalarınızı kalıcı olarak saklamaz. Medya temizleme politikası{' '}
                {demoPolicy.media_ttl_hours} saatliktir.
              </p>
            </div>
          </aside>
        )}

        {/* ═══════════════════════════ ERROR BANNER ═══════════════════════════ */}
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
              <p className="mt-1 break-words text-sm text-red-100/90">{errorDetails.message}</p>
              <p className="mt-1 break-words text-xs leading-5 text-zinc-400">{errorDetails.hint}</p>
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

        {/* ═══════════════════════════ MAIN TWO-COLUMN LAYOUT ═══════════════════════════ */}
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          {/* ── LEFT: Source panel ── */}
          <section className="glass-panel h-fit rounded-2xl border border-white/10 p-4 shadow-card sm:p-5 lg:sticky lg:top-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  01 / Kaynak video
                </p>
                <h2 className="mt-1 text-xl font-bold">Sahneni seç</h2>
              </div>
              {(selectedFile || selectedTemplate) && (
                <button
                  type="button"
                  onClick={reset}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Kaynağı değiştir
                </button>
              )}
            </div>

            <div className="mb-4 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 text-xs font-bold">
              <button
                type="button"
                disabled={busy}
                onClick={() => changeSourceMode('upload')}
                className={`rounded-lg px-3 py-2.5 transition ${sourceMode === 'upload' ? 'bg-white text-ink' : 'text-zinc-500 hover:text-white'}`}
              >
                Kendi videonu yükle
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => changeSourceMode('templates')}
                className={`rounded-lg px-3 py-2.5 transition ${sourceMode === 'templates' ? 'bg-violet text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                Hazır sahne seç
              </button>
            </div>

            {sourceMode === 'upload' ? (
              !selectedFile ? (
                <UploadZone
                  onFile={handleFile}
                  disabled={busy}
                  maxFileSizeMb={demoPolicy?.enabled ? demoPolicy.max_file_size_mb : 50}
                  maxDurationSeconds={demoPolicy?.enabled ? demoPolicy.max_video_duration_seconds : 60}
                />
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
                  <div className="mt-3 flex flex-col items-start gap-1.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <span className="min-w-0 truncate font-medium text-zinc-300">
                      {selectedFile.name}
                    </span>
                    <span className="shrink-0 text-zinc-500">
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
              )
            ) : !selectedTemplate ? (
              <TemplateGallery
                selectingId={selectingTemplateId}
                onSelect={handleTabTemplateSelect}
              />
            ) : (
              <div>
                {inputPreview ? (
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
                ) : (
                  <div className="grid aspect-video place-items-center rounded-xl border border-dashed border-violet/25 bg-violet/[0.04] p-6 text-center">
                    <div>
                      <Film className="mx-auto h-8 w-8 text-violet/60" />
                      <p className="mt-3 text-sm font-bold text-zinc-300">Demo medya yakında</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        Replikleri düzenle ve mikrofon kayıt akışını dene.
                        <br />
                        Kendi videonu bağlayarak tam export alabilirsin.
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.025] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-bold text-white">{selectedTemplate.title}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {selectedTemplate.category} · {selectedTemplate.duration_seconds.toFixed(1)} sn · {selectedTemplate.lines.length} replik
                      </p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-lime" />
                  </div>
                  <p className="mt-3 break-all text-[11px] leading-5 text-zinc-400">
                    Lisans: {selectedTemplate.license}<br />
                    Kaynak: {selectedTemplate.source}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ── RIGHT: Editor panel ── */}
          <section className="glass-panel rounded-2xl border border-white/10 p-4 shadow-card sm:p-5">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  02 / Dublaj
                </p>
                <h2 className="mt-1 text-xl font-bold">Sahneyi seslendir</h2>
              </div>
              <div className="grid w-full grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1 text-xs font-semibold sm:w-auto">
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
                  disabled={busy || Boolean(selectedTemplate && !upload)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 transition ${mode === 'ai-voice' ? 'bg-violet text-white' : 'text-zinc-500 hover:text-white'}`}
                >
                  <Bot className="h-3.5 w-3.5" /> AI ses
                </button>
              </div>
            </div>

            {!projectReady ? (
              <div className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-6 text-center sm:min-h-80 sm:px-6">
                <div className="min-w-0 max-w-sm">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500">
                    <Video className="h-7 w-7" />
                  </span>
                  <p className="mt-4 text-lg font-bold text-zinc-300">Önce bir kaynak seç</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Hazır sahne seçtiğinde veya videonu yüklediğinde replik zaman çizelgesi burada oluşacak.
                  </p>
                  {/* Mini preview lines */}
                  <div className="mt-5 space-y-2">
                    {MOCK_LINES.map((line, i) => (
                      <div key={i} className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.025] px-3 py-2 text-left">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-violet/10 text-[9px] font-bold text-violet">{i + 1}</span>
                        <span className="min-w-0 flex-1 break-words text-xs text-zinc-400">{line.text}</span>
                        <Clock3 className="h-3 w-3 shrink-0 text-zinc-500" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => changeSourceMode('templates')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet/15 px-3 py-2 text-xs font-bold text-violet transition hover:bg-violet/25"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Hazır sahne seç
                    </button>
                    <button
                      type="button"
                      onClick={() => changeSourceMode('upload')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 text-xs font-bold text-zinc-400 transition hover:bg-white/10"
                    >
                      Video yükle
                    </button>
                  </div>
                </div>
              </div>
            ) : mode === 'my-voice' ? (
              <TimelineRecorder
                key={upload?.video_id ?? selectedTemplate?.id}
                duration={upload?.duration_seconds ?? selectedTemplate?.duration_seconds ?? 0}
                videoRef={videoRef}
                initialLines={selectedTemplate?.lines}
                videoAvailable={Boolean(inputPreview)}
                exportUnavailableReason={upload ? '' : 'MP4 export için template video dosyasının projeye güvenli biçimde eklenmesi veya kendi videonun yüklenmesi gerekir.'}
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-lime/60">
                    Gerçek job durumu
                  </p>
                  <span className="text-xs font-bold tabular-nums text-lime">%{jobProgress}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-semibold text-lime">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  {jobMessage || 'Export sırasına alınıyor…'}
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-lime transition-all duration-700"
                    style={{ width: `${jobProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Durum backend job servisinden düzenli olarak güncelleniyor.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ═══════════════════════════ OUTPUT SECTION ═══════════════════════════ */}
        {outputUrl && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-lime/25 bg-panel/95 shadow-glow-lg">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3 text-sm font-extrabold text-ink transition hover:bg-[#d5ff78] shadow-glow"
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

        <EthicsNotice />

            </>
          ) : activeTab === 'scene_detail' && detailTemplateId ? (
            <SceneDetail 
              templateId={detailTemplateId} 
              onBack={() => setActiveTab('scenes')}
              onPlay={handlePlayFromDetail}
              onToast={showToast}
            />
          ) : activeTab === 'scenes' ? (
            <div className="py-4">
              <div className="mb-8 max-w-2xl">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Sahne Kataloğu</h1>
                <p className="mt-3 text-zinc-400">Dublaj yapmak için popüler bir sahne seç veya doğrudan projeye başla.</p>
              </div>
              <TemplateGallery onSelect={handleTabTemplateSelect} />
            </div>
          ) : activeTab === 'dubs' ? (
            <ShowcaseDubs />
          ) : activeTab === 'login' || activeTab === 'register' ? (
            <AuthPage mode={activeTab} setActiveTab={setActiveTab} onToast={showToast} />
          ) : (
            <DailyDub setActiveTab={setActiveTab} handleFeatureSoon={handleFeatureSoon} />
          )}
        </div>
      </main>

      {showHowTo && (
        <HowToModal setShowHowTo={setShowHowTo} setActiveTab={setActiveTab} />
      )}

      <PlatformFooter setActiveTab={setActiveTab} handleFeatureSoon={handleFeatureSoon} handleLegalLink={handleLegalLink} setShowHowTo={setShowHowTo} />
    </div>
  )
}

export default App
