import { useEffect, useState } from 'react'
import {
  Clapperboard,
  Clock3,
  FileQuestion,
  LoaderCircle,
  Mic2,
  RefreshCw,
  Scale,
} from 'lucide-react'
import { fetchTemplates } from '../lib/api'
import type { VideoTemplate } from '../types'

interface TemplateGalleryProps {
  selectedId?: string
  selectingId?: string
  onSelect: (templateId: string) => void
  onError: (message: string) => void
}

export function TemplateGallery({
  selectedId,
  selectingId,
  onSelect,
  onError,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    void fetchTemplates()
      .then((items) => {
        if (!cancelled) setTemplates(items)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        const message = error instanceof Error
          ? error.message
          : 'Hazır sahneler yüklenemedi.'
        setLoadError(message)
        onError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onError, reloadKey])

  if (loading) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-white/8 bg-black/15 text-center">
        <div>
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-lime" />
          <p className="mt-3 text-sm font-semibold text-zinc-300">Hazır sahneler yükleniyor…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-6 text-center">
        <div>
          <FileQuestion className="mx-auto h-8 w-8 text-red-300" />
          <p className="mt-3 text-sm font-bold text-red-200">Sahne kataloğu açılamadı</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-200 transition hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tekrar dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const isSelected = selectedId === template.id
        const isSelecting = selectingId === template.id
        return (
          <article
            key={template.id}
            className={`rounded-2xl border p-4 transition ${isSelected ? 'border-lime/35 bg-lime/[0.045]' : 'border-white/8 bg-black/15 hover:border-white/15'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-violet/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet">
                  {template.category}
                </span>
                <h3 className="mt-2 font-bold text-white">{template.title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{template.description}</p>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-zinc-500">
                <Clapperboard className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                <Clock3 className="h-3.5 w-3.5" /> {template.duration_seconds.toFixed(1)} sn
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                <Mic2 className="h-3.5 w-3.5" /> {template.lines.length} replik
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
                <Scale className="h-3.5 w-3.5" /> {template.license}
              </span>
            </div>
            <p className="mt-3 truncate text-[10px] text-zinc-600" title={template.source}>
              Kaynak: {template.source}
            </p>
            <button
              type="button"
              onClick={() => onSelect(template.id)}
              disabled={Boolean(selectingId)}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-ink transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
            >
              {isSelecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
              {isSelected ? 'Sahne seçildi' : isSelecting ? 'Sahne hazırlanıyor…' : 'Dublaj yap'}
            </button>
          </article>
        )
      })}
    </div>
  )
}
