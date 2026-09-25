import { useEffect, useState } from 'react'
import {
  Clapperboard,
  Clock3,
  FileQuestion,
  Flame,
  Laugh,
  LoaderCircle,
  Mic2,
  Presentation,
  RefreshCw,
  Rocket,
  Scale,
  Sparkles,
  Theater,
} from 'lucide-react'
import { fetchTemplates } from '../lib/api'
import type { VideoTemplate } from '../types'

interface TemplateGalleryProps {
  selectedId?: string
  selectingId?: string
  onSelect: (templateId: string) => void
}

/** Map category names to a CSS class for the placeholder thumbnail gradient. */
function thumbClass(category: string): string {
  const lower = category.toLocaleLowerCase('tr-TR')
  if (lower.includes('komedi') || lower.includes('tepki')) return 'thumb-comedy'
  if (lower.includes('dram')) return 'thumb-drama'
  if (lower.includes('bilim') || lower.includes('kurgu')) return 'thumb-scifi'
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo')) return 'thumb-product'
  return 'thumb-default'
}

/** Map category to a decorative icon rendered on the placeholder thumbnail. */
function ThumbIcon({ category }: { category: string }) {
  const lower = category.toLocaleLowerCase('tr-TR')
  const cls = 'h-8 w-8 drop-shadow-lg'
  if (lower.includes('komedi') || lower.includes('tepki')) return <Laugh className={cls} />
  if (lower.includes('dram')) return <Theater className={cls} />
  if (lower.includes('bilim') || lower.includes('kurgu')) return <Rocket className={cls} />
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo')) return <Presentation className={cls} />
  return <Clapperboard className={cls} />
}

/** Assign a simple difficulty label based on line count and duration. */
function difficulty(template: VideoTemplate): { label: string; color: string } {
  if (template.lines.length <= 2 && template.duration_seconds <= 8) {
    return { label: 'Kolay', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
  }
  return { label: 'Orta', color: 'text-amber-300 bg-amber-300/10 border-amber-300/20' }
}

export function TemplateGallery({
  selectedId,
  selectingId,
  onSelect,
}: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tümü')
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
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  if (loading) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-white/10 bg-black/15 p-5 text-center sm:min-h-64">
        <div>
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-lime" />
          <p className="mt-3 text-sm font-semibold text-zinc-300">Hazır sahneler yükleniyor…</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5 text-center sm:min-h-64 sm:p-6">
        <div className="min-w-0 max-w-md">
          <FileQuestion className="mx-auto h-8 w-8 text-red-300" />
          <p className="mt-3 text-sm font-bold text-red-200">Sahne kataloğu açılamadı</p>
          <p className="mt-1 break-words text-xs leading-5 text-zinc-400">{loadError}</p>
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

  if (!templates.length) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/10 bg-black/15 p-5 text-center sm:min-h-64">
        <div className="max-w-sm">
          <FileQuestion className="mx-auto h-8 w-8 text-zinc-500" />
          <p className="mt-3 text-sm font-bold text-zinc-200">Henüz hazır sahne yok</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Kendi videonu yükleyerek dublaj akışına devam edebilirsin.
          </p>
        </div>
      </div>
    )
  }

  const categories = ['Tümü', ...Array.from(new Set(templates.map(t => t.category)))]
  const filteredTemplates = filter === 'Tümü' ? templates : templates.filter(t => t.category === filter)

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet" />
          <p className="text-xs font-semibold text-zinc-400">
            {templates.length} hazır sahne · Video dosyası eklendiğinde doğrudan kullanılır
          </p>
        </div>
        
        {categories.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  filter === c
                    ? 'bg-lime text-ink'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">Bu kategoride sahne bulunamadı.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
          const isSelected = selectedId === template.id
          const isSelecting = selectingId === template.id
          const diff = difficulty(template)
          return (
            <article
              key={template.id}
              className={`card-hover min-w-0 overflow-hidden rounded-2xl border shadow-card ${isSelected ? 'border-lime/35 bg-lime/[0.045]' : 'border-white/10 bg-surface/80 hover:border-white/20'}`}
            >
              {/* Placeholder thumbnail area */}
              <div className={`${thumbClass(template.category)} relative flex h-24 items-center justify-center overflow-hidden sm:h-28`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 text-white/90">
                  <ThumbIcon category={template.category} />
                </div>
                {/* Duration badge */}
                <span className="absolute bottom-2 right-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
                  {template.duration_seconds.toFixed(0)}s
                </span>
                {/* Category badge */}
                <span className="absolute left-2 top-2 z-10 max-w-[calc(100%_-_4.5rem)] truncate rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  {template.category}
                </span>
              </div>

              <div className="p-3.5">
                <h3 className="line-clamp-2 break-words font-bold leading-5 text-white">{template.title}</h3>
                <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-400">{template.description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-medium text-zinc-400">
                    <Mic2 className="h-3 w-3" /> {template.lines.length} replik
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-medium text-zinc-400">
                    <Clock3 className="h-3 w-3" /> {template.duration_seconds.toFixed(1)} sn
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-bold ${diff.color}`}>
                    <Flame className="h-3 w-3" /> {diff.label}
                  </span>
                </div>

                <p className="mt-2.5 flex min-w-0 items-center gap-1.5 text-[10px] text-zinc-500" title={`${template.license} · ${template.source}`}>
                  <Scale className="h-3 w-3 shrink-0" />
                  <span className="truncate">{template.license}</span>
                </p>

                <button
                  type="button"
                  onClick={() => onSelect(template.id)}
                  disabled={Boolean(selectingId)}
                  className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition disabled:cursor-wait disabled:opacity-50 ${
                    isSelected
                      ? 'bg-lime text-ink'
                      : 'bg-white text-ink hover:bg-zinc-200'
                  }`}
                >
                  {isSelecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
                  {isSelected ? 'Sahne seçildi' : isSelecting ? 'Sahne hazırlanıyor…' : 'Dublaj yap'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
      )}
    </div>
  )
}
