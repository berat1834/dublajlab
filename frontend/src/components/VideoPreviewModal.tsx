import { useEffect } from 'react'
import { Download, Link2, Play, X } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

interface VideoThumbnailProps {
  sourceUrl: string
  title: string
  onOpen: () => void
}

export function VideoThumbnail({ sourceUrl, title, onOpen }: VideoThumbnailProps) {
  const { t } = useLanguage()
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-black/50 text-left"
      aria-label={t('video.play_named').replace('{title}', title)}
    >
      <video
        src={sourceUrl}
        preload="metadata"
        muted
        playsInline
        className="h-full w-full object-cover opacity-80 transition group-hover:scale-[1.02] group-hover:opacity-100"
        onLoadedMetadata={(event) => {
          const video = event.currentTarget
          if (Number.isFinite(video.duration) && video.duration > 0.2) video.currentTime = 0.1
        }}
      />
      <span className="absolute inset-0 grid place-items-center bg-black/15 transition group-hover:bg-black/5">
        <span className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/65 text-white shadow-xl backdrop-blur-sm transition group-hover:scale-105 group-hover:text-lime">
          <Play className="h-5 w-5 fill-current" />
        </span>
      </span>
    </button>
  )
}

interface VideoPreviewModalProps {
  sourceUrl: string
  title: string
  retentionLabel?: string
  onClose: () => void
  onShare?: () => void
}

export function VideoPreviewModal({
  sourceUrl,
  title,
  retentionLabel,
  onClose,
  onShare,
}: VideoPreviewModalProps) {
  const { t } = useLanguage()

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#101014] shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 className="truncate font-bold text-white">{title}</h2>
            {retentionLabel && <p className="mt-1 text-xs text-zinc-400">{retentionLabel}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label={t('video.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-black">
          <video
            src={sourceUrl}
            controls
            autoPlay
            playsInline
            className="mx-auto max-h-[72vh] w-full object-contain"
          />
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 p-4 sm:flex-row sm:justify-end">
          {onShare && (
            <button
              type="button"
              onClick={onShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-zinc-200 transition hover:bg-white/10"
            >
              <Link2 className="h-4 w-4" /> {t('video.share')}
            </button>
          )}
          <a
            href={sourceUrl}
            download
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-4 py-2.5 text-sm font-extrabold text-ink transition hover:brightness-110"
          >
            <Download className="h-4 w-4" /> {t('video.download')}
          </a>
        </div>
      </div>
    </div>
  )
}
