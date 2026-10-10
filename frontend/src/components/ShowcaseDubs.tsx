import { useEffect, useState } from 'react'
import { Play, CheckCircle2, MessageSquare, Download, Flag } from 'lucide-react'
import { getPublicDubs, toggleLikePublicDub, recordViewPublicDub, type PublicDub, absoluteApiUrl } from '../lib/api'
import { ReportModal } from './ReportModal'
import { PublicDubComments } from './PublicDubComments'
import type { Tab } from '../types'
import { useLanguage } from '../LanguageContext'

export function ShowcaseDubs({ onToast, setActiveTab }: { onToast: (msg: string) => void; setActiveTab: (tab: Tab) => void }) {
  const { language, t } = useLanguage()
  const [dubs, setDubs] = useState<PublicDub[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reportingProjectId, setReportingProjectId] = useState<string | null>(null)
  const [commentingProjectId, setCommentingProjectId] = useState<string | null>(null)

  useEffect(() => {
    const fetchDubs = async () => {
      try {
        const data = await getPublicDubs()
        setDubs(data)
      } catch {
        setLoadError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchDubs()
  }, [])

  const handleLikeToggle = async (dub: PublicDub) => {
    if (!localStorage.getItem('token')) {
      onToast(t('dubs.like_login'))
      return
    }

    // Optimistic UI update
    const isLiking = !dub.liked_by_me
    setDubs(currentDubs => currentDubs.map(d => {
      if (d.project_id === dub.project_id) {
        return {
          ...d,
          liked_by_me: isLiking,
          like_count: isLiking ? d.like_count + 1 : d.like_count - 1
        }
      }
      return d
    }))

    try {
      await toggleLikePublicDub(dub.project_id, isLiking)
    } catch {
      onToast(t('dubs.action_failed'))
    }
  }

  const handlePlayDub = (projectId: string) => {
    recordViewPublicDub(projectId).catch(() => {})
    setDubs(currentDubs => currentDubs.map(d =>
      d.project_id === projectId ? { ...d, view_count: d.view_count + 1 } : d
    ))
    onToast(t('dubs.preparing'))
  }

  return (
    <div className="py-4">
      {reportingProjectId && (
        <ReportModal
          projectId={reportingProjectId}
          onClose={() => setReportingProjectId(null)}
          onToast={onToast}
        />
      )}
      {commentingProjectId && (
        <PublicDubComments
          projectId={commentingProjectId}
          onClose={() => setCommentingProjectId(null)}
          onToast={onToast}
          onLogin={() => { setCommentingProjectId(null); setActiveTab('login') }}
        />
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{t('dubs.title')}</h1>
        <p className="mt-3 text-zinc-400">{t('dubs.description')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dubs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dubs.map((dub) => (
            <div key={dub.project_id} className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-card transition hover:border-white/20">
              <div
                className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center cursor-pointer"
                onClick={() => handlePlayDub(dub.project_id)}
              >
                <Play className="h-10 w-10 text-white/40 group-hover:text-lime transition group-hover:scale-110" />
                {dub.duration_seconds && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
                    {Math.round(parseFloat(dub.duration_seconds))}s
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white line-clamp-1">{dub.title}</h3>
                  <button onClick={() => setReportingProjectId(dub.project_id)} className="text-zinc-500 hover:text-red-400 transition" title={t('dubs.report')} aria-label={t('dubs.report')}>
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{dub.display_name} • {new Date(dub.created_at).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US')}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-zinc-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1" title={t('dubs.views')}>
                      <CheckCircle2 className="h-3 w-3" /> {dub.view_count}
                    </span>
                    <button
                      onClick={() => handleLikeToggle(dub)}
                      className={`flex items-center gap-1 transition ${dub.liked_by_me ? 'text-red-500 hover:text-red-400' : 'hover:text-red-400'}`}
                      title={dub.liked_by_me ? t('dubs.unlike') : t('dubs.like')}
                      aria-label={dub.liked_by_me ? t('dubs.unlike') : t('dubs.like')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={dub.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      {dub.like_count}
                    </button>
                    <button
                      onClick={() => setCommentingProjectId(dub.project_id)}
                      className="flex items-center gap-1 hover:text-lime-400 transition"
                      title={t('dubs.comments')}
                      aria-label={t('dubs.comments')}
                    >
                      <MessageSquare className="h-3 w-3" /> {t('dubs.comments')}
                    </button>
                  </div>
                  {dub.download_url && (
                    <a href={absoluteApiUrl(dub.download_url)} download className="p-1.5 bg-lime-400/10 text-lime-400 rounded-md hover:bg-lime-400/20 transition" title={t('dubs.download')} aria-label={t('dubs.download')}>
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-14 text-center shadow-card">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-lime/20 bg-lime/10 text-lime">
            <Play className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-xl font-black text-white">
            {loadError ? t('dubs.load_error_title') : t('dubs.empty_title')}
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-400">
            {loadError ? t('dubs.load_error_desc') : t('dubs.empty_desc')}
          </p>
          <button type="button" onClick={() => setActiveTab('play')} className="mt-6 rounded-xl bg-lime px-5 py-3 text-sm font-black text-ink transition hover:bg-[#d5ff78]">
            {t('dubs.empty_cta')}
          </button>
        </div>
      )}
    </div>
  )
}
