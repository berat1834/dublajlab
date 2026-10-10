import { useEffect, useState } from 'react'
import { Clock3, Flame, LoaderCircle, Mic2, Scale } from 'lucide-react'
import { fetchTemplates } from '../lib/api'
import type { VideoTemplate } from '../types'
import { thumbClass, ThumbIcon, difficulty } from '../lib/templateUtils'
import { useLanguage } from '../LanguageContext'

interface DemoTeaserProps {
  onSelect: (templateId: string) => void
  selectingId?: string
}

export function DemoTeaser({ onSelect, selectingId }: DemoTeaserProps) {
  const { t } = useLanguage()
  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void fetchTemplates()
      .then((items) => {
        if (active) {
          const demos = items.filter(t => t.is_demo).slice(0, 3)
          setTemplates(demos)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  if (loading || templates.length === 0) return null

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{t('demo_scenes.title')}</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isSelecting = selectingId === template.id
          const diff = difficulty(template)
          return (
            <article
              key={template.id}
              className="card-hover min-w-0 flex flex-col h-full overflow-hidden rounded-2xl border border-white/10 bg-surface/80 hover:border-white/20 shadow-card"
            >
              <div className={`${thumbClass(template.category)} relative flex h-24 items-center justify-center overflow-hidden sm:h-28`}>
                <div className="absolute inset-0 bg-black/20" />
                <div className="relative z-10 text-white/90">
                  <ThumbIcon category={template.category} />
                </div>
                <span className="absolute bottom-2 right-2 z-10 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
                  {template.duration_seconds.toFixed(0)}s
                </span>
                <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 items-start">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                    {template.category}
                  </span>
                  {template.is_demo && (
                    <span className="max-w-fit rounded-full bg-violet-500/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm shadow-glow-sm">
                      {t('templates.demo')}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 flex flex-col flex-grow">
                <h3 className="line-clamp-2 break-words font-bold leading-5 text-white">{template.title}</h3>
                <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-zinc-400">{template.description}</p>

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
                  className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-ink transition hover:bg-zinc-200 disabled:cursor-wait disabled:opacity-50"
                >
                  {isSelecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
                  {t('demo_scenes.cta')}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
