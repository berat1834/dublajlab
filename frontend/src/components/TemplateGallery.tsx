import { useEffect, useState } from 'react'
import {
  Clock3,
  FileQuestion,
  Flame,
  LoaderCircle,
  Mic2,
  RefreshCw,
  Scale,
} from 'lucide-react'
import { fetchTemplates } from '../lib/api'
import type { VideoTemplate } from '../types'
import { thumbClass, ThumbIcon, difficulty } from '../lib/templateUtils'
import { useLanguage } from '../LanguageContext'

interface TemplateGalleryProps {
  selectedId?: string
  selectingId?: string
  onSelect: (templateId: string) => void
}

export function TemplateGallery({
  selectedId,
  selectingId,
  onSelect,
}: TemplateGalleryProps) {
  const { t } = useLanguage()
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('popular')
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
          : t('templates.load_error')
        setLoadError(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [reloadKey, t])

  if (loading) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-white/10 bg-black/15 p-5 text-center sm:min-h-64">
        <div>
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-lime" />
          <p className="mt-3 text-sm font-semibold text-zinc-300">{t('templates.loading')}</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5 text-center sm:min-h-64 sm:p-6">
        <div className="min-w-0 max-w-md">
          <FileQuestion className="mx-auto h-8 w-8 text-red-300" />
          <p className="mt-3 text-sm font-bold text-red-200">{t('templates.open_error')}</p>
          <p className="mt-1 break-words text-xs leading-5 text-zinc-400">{loadError}</p>
          <button
            type="button"
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-zinc-200 transition hover:bg-white/5"
          >
            <RefreshCw className="h-3.5 w-3.5" /> {t('templates.retry')}
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
          <p className="mt-3 text-sm font-bold text-zinc-200">{t('templates.empty')}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            {t('templates.empty_hint')}
          </p>
        </div>
      </div>
    )
  }

  const categories = ['', ...Array.from(new Set(templates.map(t => t.category)))]
  
  let filteredTemplates = filter === '' ? templates : templates.filter(t => t.category === filter)
  if (searchQuery) {
    const q = searchQuery.toLowerCase()
    filteredTemplates = filteredTemplates.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
  }
  
  if (sortOption === 'shortest') {
    filteredTemplates = filteredTemplates.sort((a, b) => a.duration_seconds - b.duration_seconds)
  } else if (sortOption === 'az') {
    filteredTemplates = filteredTemplates.sort((a, b) => a.title.localeCompare(b.title))
  } else {
    // Popüler (default for now, just keep original or by mock play count if we had it)
    filteredTemplates = filteredTemplates.sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                filter === cat ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              {cat ? (t('category.' + cat) === 'category.' + cat ? cat : t('category.' + cat)) : t('templates.all')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder={t('templates.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-lime focus:outline-none transition"
          />
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none"
          >
            <option value="popular">{t('templates.popular')}</option>
            <option value="shortest">{t('templates.shortest')}</option>
            <option value="az">A-Z</option>
          </select>
        </div>
      </div>
      


      {filteredTemplates.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">{t('templates.no_results')}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
          const isSelected = selectedId === template.id
          const isSelecting = selectingId === template.id
          const diff = difficulty(template)
          const titleKey = `template.${template.id}.title`
          const titleText = t(titleKey) === titleKey ? template.title : t(titleKey)
          const descKey = `template.${template.id}.desc`
          const descText = t(descKey) === descKey ? template.description : t(descKey)
          const catKey = `category.${template.category}`
          const catText = t(catKey) === catKey ? template.category : t(catKey)
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
                <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 items-start">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {catText}
                  </span>
                  {template.is_demo && (
                    <span className="max-w-fit rounded-full bg-violet-500/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-glow-sm">
                      {t('templates.demo')}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5">
                <h3 className="line-clamp-2 break-words font-bold leading-5 text-white">{titleText}</h3>
                <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-400">{descText}</p>

                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-medium text-zinc-400">
                    <Mic2 className="h-3 w-3" /> {template.lines.length} {t('studio.template.lines')}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-1 font-medium text-zinc-400">
                    <Clock3 className="h-3 w-3" /> {template.duration_seconds.toFixed(1)} {t('studio.template.seconds')}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-bold ${diff.color}`}>
                    <Flame className="h-3 w-3" /> {diff.label === 'Kolay' ? t('templates.easy') : t('templates.medium')}
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
                  {isSelected ? t('templates.selected') : t('templates.details')}
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
