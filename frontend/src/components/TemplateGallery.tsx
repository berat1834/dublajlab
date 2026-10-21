import { useEffect, useState } from 'react'
import {
  ArrowDownAZ,
  Clock3,
  FileQuestion,
  Flame,
  LoaderCircle,
  Mic2,
  RefreshCw,
  Scale,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { fetchTemplates } from '../lib/api'
import type { VideoTemplate } from '../types'
import { thumbClass, ThumbIcon, difficulty, localizeTemplate } from '../lib/templateUtils'
import { filterAndSortTemplates, type TemplateSortOption } from '../lib/templateCatalog'
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
  const { t, language } = useLanguage()
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<TemplateSortOption>('popular')
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    void fetchTemplates()
      .then((items) => {
        if (!cancelled) setTemplates(items.map((item) => localizeTemplate(item, language)))
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
  }, [language, reloadKey, t])

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

  const categories = ['', ...Array.from(new Set(templates.map((template) => template.category)))]
  const filteredTemplates = filterAndSortTemplates(
    templates,
    filter,
    searchQuery,
    sortOption,
    language === 'TR' ? 'tr-TR' : 'en-US',
  )
  const sortOptions = [
    { value: 'popular' as const, label: t('templates.popular'), Icon: Flame },
    { value: 'shortest' as const, label: t('templates.shortest'), Icon: Clock3 },
    { value: 'az' as const, label: 'A-Z', Icon: ArrowDownAZ },
  ]

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-surface/70 p-3 shadow-card sm:p-4">
        <label className="relative block">
          <span className="sr-only">{t('templates.search')}</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            placeholder={t('templates.search')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-11 w-full rounded-xl border border-white/10 bg-black/35 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-500 hover:border-white/20 focus:border-lime/60 focus:ring-2 focus:ring-lime/15"
          />
        </label>

        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> {t('templates.filter_label')}
            </div>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t('templates.filter_label')}>
              {categories.map((category) => {
                const categoryKey = `category.${category}`
                const categoryLabel = category
                  ? (t(categoryKey) === categoryKey ? category : t(categoryKey))
                  : t('templates.all')
                return (
                  <button
                    type="button"
                    key={category}
                    onClick={() => setFilter(category)}
                    aria-pressed={filter === category}
                    className={`min-h-10 shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 ${
                      filter === category
                        ? 'border-lime/40 bg-lime text-ink shadow-glow-sm'
                        : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {categoryLabel}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
              {t('templates.sort_label')}
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-black/30 p-1" role="group" aria-label={t('templates.sort_label')}>
              {sortOptions.map(({ value, label, Icon }) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setSortOption(value)}
                  aria-pressed={sortOption === value}
                  className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${
                    sortOption === value
                      ? 'bg-white text-ink shadow-md'
                      : 'text-zinc-400 hover:bg-white/[0.07] hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
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
