import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CircleStop,
  Clock3,
  Headphones,
  Mic,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import type { RefObject } from 'react'
import type { TimelineLine } from '../types'

interface RecordedClip {
  blob: Blob
  url: string
}

interface TimelineRecorderProps {
  duration: number
  videoRef: RefObject<HTMLVideoElement | null>
  disabled?: boolean
  onError: (message: string) => void
  onProcess: (
    lines: TimelineLine[],
    recordings: Map<string, Blob>,
    muteOriginalAudio: boolean,
    burnSubtitles: boolean,
  ) => Promise<void>
}

function initialLines(duration: number): TimelineLine[] {
  const count = duration >= 6 ? 3 : duration >= 2 ? 2 : 1
  const slot = duration / count
  return Array.from({ length: count }, (_, index) => ({
    id: `line-${index + 1}`,
    start: Number((index * slot).toFixed(2)),
    end: Number(((index + 1) * slot).toFixed(2)),
    text: `${index + 1}. repliğini buraya yaz.`,
  }))
}

function supportedMimeType() {
  const options = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return options.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export function TimelineRecorder({
  duration,
  videoRef,
  disabled = false,
  onError,
  onProcess,
}: TimelineRecorderProps) {
  const [lines, setLines] = useState(() => initialLines(duration))
  const [clips, setClips] = useState<Map<string, RecordedClip>>(new Map())
  const [activeLineId, setActiveLineId] = useState<string | null>(null)
  const [muteOriginalAudio, setMuteOriginalAudio] = useState(true)
  const [burnSubtitles, setBurnSubtitles] = useState(true)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopTimerRef = useRef<number | null>(null)
  const previousMutedRef = useRef(false)
  const clipsRef = useRef(clips)

  useEffect(() => {
    clipsRef.current = clips
  }, [clips])

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current)
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      clipsRef.current.forEach((clip) => URL.revokeObjectURL(clip.url))
    }
  }, [])

  const completedCount = useMemo(
    () => lines.filter((line) => clips.has(line.id)).length,
    [clips, lines],
  )

  const updateLine = (id: string, patch: Partial<TimelineLine>) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    )
  }

  const previewLine = (line: TimelineLine) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = line.start
    void video.play()
    window.setTimeout(() => {
      if (video.currentTime >= line.end - 0.1) video.pause()
    }, Math.max(0, (line.end - line.start) * 1000))
  }

  const stopRecording = () => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current)
    stopTimerRef.current = null
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    const video = videoRef.current
    if (video) {
      video.pause()
      video.muted = previousMutedRef.current
    }
  }

  const startRecording = async (line: TimelineLine) => {
    onError('')
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      onError('Tarayıcınız mikrofon kaydını desteklemiyor. Güncel Chrome, Edge veya Safari kullanın.')
      return
    }
    if (!line.text.trim() || line.end <= line.start || line.end > duration + 0.05) {
      onError('Replik metnini ve zaman aralığını kontrol edin.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      const mimeType = supportedMimeType()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks: BlobPart[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        if (blob.size) {
          setClips((current) => {
            const next = new Map(current)
            const previous = next.get(line.id)
            if (previous) URL.revokeObjectURL(previous.url)
            next.set(line.id, { blob, url: URL.createObjectURL(blob) })
            return next
          })
        }
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
        recorderRef.current = null
        setActiveLineId(null)
      }
      streamRef.current = stream
      recorderRef.current = recorder
      setActiveLineId(line.id)
      recorder.start(200)

      const video = videoRef.current
      if (video) {
        previousMutedRef.current = video.muted
        video.muted = true
        video.currentTime = line.start
        void video.play()
      }
      stopTimerRef.current = window.setTimeout(
        stopRecording,
        Math.max(250, (line.end - line.start) * 1000),
      )
    } catch {
      onError('Mikrofon açılamadı. Tarayıcı iznini kontrol edip tekrar deneyin.')
    }
  }

  const addLine = () => {
    if (lines.length >= 20) {
      onError('En fazla 20 replik ekleyebilirsiniz.')
      return
    }
    const lastEnd = lines[lines.length - 1]?.end ?? 0
    const start = Math.min(lastEnd, Math.max(0, duration - 0.5))
    const end = Math.min(duration, Math.max(start + 0.5, start + duration / 5))
    setLines((current) => [
      ...current,
      {
        id: `line-${crypto.randomUUID()}`,
        start: Number(start.toFixed(2)),
        end: Number(end.toFixed(2)),
        text: 'Yeni replik',
      },
    ])
  }

  const removeLine = (id: string) => {
    if (lines.length === 1) return
    const clip = clips.get(id)
    if (clip) URL.revokeObjectURL(clip.url)
    setClips((current) => {
      const next = new Map(current)
      next.delete(id)
      return next
    })
    setLines((current) => current.filter((line) => line.id !== id))
  }

  const submit = async () => {
    const invalid = lines.some(
      (line) =>
        !line.text.trim() ||
        line.start < 0 ||
        line.end <= line.start ||
        line.end > duration + 0.05,
    )
    if (invalid) {
      onError('Tüm replik metinlerini ve zaman aralıklarını kontrol edin.')
      return
    }
    if (completedCount !== lines.length) {
      onError('Videoyu oluşturmadan önce her repliği kaydedin.')
      return
    }
    const recordings = new Map<string, Blob>()
    clips.forEach((clip, id) => recordings.set(id, clip.blob))
    await onProcess(lines, recordings, muteOriginalAudio, burnSubtitles)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Replik zaman çizelgesi</p>
          <p className="mt-1 text-xs text-zinc-500">
            {completedCount}/{lines.length} kayıt hazır
          </p>
        </div>
        <button
          type="button"
          onClick={addLine}
          disabled={disabled || Boolean(activeLineId)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:bg-white/5 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" /> Replik ekle
        </button>
      </div>

      <div className="max-h-[590px] space-y-3 overflow-y-auto pr-1">
        {lines.map((line, index) => {
          const clip = clips.get(line.id)
          const isRecording = activeLineId === line.id
          return (
            <article
              key={line.id}
              className={`rounded-xl border p-3 transition ${
                isRecording
                  ? 'border-red-400/50 bg-red-400/5'
                  : clip
                    ? 'border-lime/25 bg-lime/[0.035]'
                    : 'border-white/8 bg-black/15'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  Replik {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Sahneyi oynat"
                    onClick={() => previewLine(line)}
                    disabled={disabled || Boolean(activeLineId)}
                    className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-white disabled:opacity-40"
                  >
                    <Play className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Repliği sil"
                    onClick={() => removeLine(line.id)}
                    disabled={disabled || Boolean(activeLineId) || lines.length === 1}
                    className="rounded-md p-1.5 text-zinc-600 transition hover:bg-red-400/10 hover:text-red-300 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <textarea
                value={line.text}
                maxLength={300}
                rows={2}
                disabled={disabled || Boolean(activeLineId)}
                onChange={(event) => updateLine(line.id, { text: event.target.value })}
                className="w-full resize-none rounded-lg border border-white/8 bg-black/25 px-3 py-2 text-sm leading-5 text-zinc-100 outline-none focus:border-lime/40 disabled:opacity-60"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                  <Clock3 className="h-3.5 w-3.5" />
                </span>
                <label className="flex items-center gap-1 text-[11px] text-zinc-500">
                  Başlangıç
                  <input
                    type="number"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={line.start}
                    disabled={disabled || Boolean(activeLineId)}
                    onChange={(event) =>
                      updateLine(line.id, { start: Number(event.target.value) })
                    }
                    className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-zinc-200 outline-none focus:border-lime/40"
                  />
                </label>
                <label className="flex items-center gap-1 text-[11px] text-zinc-500">
                  Bitiş
                  <input
                    type="number"
                    min="0"
                    max={duration}
                    step="0.1"
                    value={line.end}
                    disabled={disabled || Boolean(activeLineId)}
                    onChange={(event) =>
                      updateLine(line.id, { end: Number(event.target.value) })
                    }
                    className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-zinc-200 outline-none focus:border-lime/40"
                  />
                </label>
                <span className="ml-auto text-[10px] tabular-nums text-zinc-700">
                  {(line.end - line.start).toFixed(1)} sn
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => (isRecording ? stopRecording() : void startRecording(line))}
                  disabled={disabled || (Boolean(activeLineId) && !isRecording)}
                  className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition disabled:opacity-40 ${
                    isRecording
                      ? 'bg-red-400 text-red-950 hover:bg-red-300'
                      : clip
                        ? 'border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10'
                        : 'bg-violet text-white hover:bg-violet/90'
                  }`}
                >
                  {isRecording ? (
                    <><CircleStop className="h-4 w-4" /> Kaydı durdur</>
                  ) : clip ? (
                    <><RotateCcw className="h-3.5 w-3.5" /> Yeniden kaydet</>
                  ) : (
                    <><Mic className="h-4 w-4" /> Kaydı başlat</>
                  )}
                </button>
                {clip && (
                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-black/20 px-2 py-1">
                    <Headphones className="h-3.5 w-3.5 shrink-0 text-lime" />
                    <audio className="h-8 min-w-0 flex-1" src={clip.url} controls />
                  </div>
                )}
                {isRecording && (
                  <span className="flex items-center gap-2 text-xs font-semibold text-red-300">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> Kayıtta
                  </span>
                )}
              </div>
            </article>
          )
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={muteOriginalAudio}
            onChange={(event) => setMuteOriginalAudio(event.target.checked)}
            disabled={disabled}
            className="accent-lime"
          />
          Orijinal sesi tamamen kapat
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-xs text-zinc-300">
          <input
            type="checkbox"
            checked={burnSubtitles}
            onChange={(event) => setBurnSubtitles(event.target.checked)}
            disabled={disabled}
            className="accent-lime"
          />
          Altyazıları videoya göm
        </label>
      </div>

      <button
        type="button"
        onClick={() => void submit()}
        disabled={disabled || Boolean(activeLineId) || completedCount !== lines.length}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-5 py-3.5 text-sm font-extrabold text-ink shadow-glow transition hover:bg-[#d5ff78] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none"
      >
        <WandSparkles className="h-5 w-5" /> Kendi Sesimle Videoyu Oluştur
      </button>
    </div>
  )
}
