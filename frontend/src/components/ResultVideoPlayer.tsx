import { useRef, useState } from 'react'
import { useLanguage } from '../LanguageContext'

interface ResultVideoPlayerProps {
  sourceUrl: string
}

function formatPlaybackTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const wholeSeconds = Math.floor(seconds)
  const minutes = Math.floor(wholeSeconds / 60)
  const remainder = wholeSeconds % 60
  return `${minutes}:${String(remainder).padStart(2, '0')}`
}

export function ResultVideoPlayer({ sourceUrl }: ResultVideoPlayerProps) {
  const { t } = useLanguage()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const updateDuration = (video: HTMLVideoElement) => {
    setDuration(Number.isFinite(video.duration) ? video.duration : 0)
    setCurrentTime(video.currentTime)
  }

  return (
    <div className="mx-auto w-full">
      <video
        ref={videoRef}
        className="mx-auto max-h-[70vh] w-full rounded-xl object-contain"
        src={sourceUrl}
        controls
        playsInline
        onLoadedMetadata={(event) => updateDuration(event.currentTarget)}
        onDurationChange={(event) => updateDuration(event.currentTarget)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
      />
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
        <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-zinc-300">
          {formatPlaybackTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(currentTime, duration || 0)}
          disabled={!duration}
          aria-label={t('video.seek')}
          onChange={(event) => {
            const nextTime = Number(event.target.value)
            if (videoRef.current) videoRef.current.currentTime = nextTime
            setCurrentTime(nextTime)
          }}
          className="h-2 min-w-0 flex-1 cursor-pointer accent-lime disabled:cursor-not-allowed disabled:opacity-40"
        />
        <span className="w-10 shrink-0 text-[11px] font-semibold tabular-nums text-zinc-500">
          {formatPlaybackTime(duration)}
        </span>
      </div>
      <p className="mt-2 text-center text-[11px] leading-4 text-zinc-500">
        {t('video.seek_hint')}
      </p>
    </div>
  )
}
