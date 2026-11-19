import { useEffect, useState } from 'react'
import { Download, Play, Trash2, Clock, CheckCircle2, AlertCircle, Globe, Lock, Share2 } from 'lucide-react'
import { getUserProjects, getUserExports, deleteUserProject, updateProjectVisibility, absoluteApiUrl } from '../lib/api'
import type { DubbingProject, DubbingExport, Tab } from '../types'
import { VideoPreviewModal, VideoThumbnail } from './VideoPreviewModal'

interface UserLibraryProps {
  onToast: (msg: string) => void
  setActiveTab: (tab: Tab) => void
}
import { useLanguage } from '../LanguageContext'

export function UserLibrary({ onToast, setActiveTab }: UserLibraryProps) {
  const { t, language } = useLanguage()
  const [projects, setProjects] = useState<DubbingProject[]>([])
  const [exports, setExports] = useState<DubbingExport[]>([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<{
    sourceUrl: string
    title: string
    retentionLabel: string
    projectId: string
    isPublic: boolean
  } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [projs, exps] = await Promise.all([
          getUserProjects(),
          getUserExports()
        ])
        setProjects(projs)
        setExports(exps)
      } catch {
        onToast(t('library.fetch_error'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [onToast, t])

  const handleDelete = async (projectId: string) => {
    if (!window.confirm(t('library.delete_confirm'))) return
    try {
      await deleteUserProject(projectId)
      onToast(t('library.deleted'))
      setProjects(projects.filter(p => p.id !== projectId))
      setExports(exports.filter(e => e.project_id !== projectId))
    } catch (err: unknown) {
      if (err instanceof Error) {
        onToast(err.message || t('library.delete_error'))
      } else {
        onToast(t('library.delete_error'))
      }
    }
  }

  const handleToggleVisibility = async (project: DubbingProject, relatedExport?: DubbingExport) => {
    if (project.status !== 'completed' || !relatedExport?.download_url) return
    const newVisibility = project.visibility === 'public' ? 'private' : 'public'
    if (newVisibility === 'public' && !window.confirm(t('library.publish_confirm'))) return
    try {
      const updated = await updateProjectVisibility(project.id, newVisibility)
      setProjects(projects.map(p => p.id === project.id ? updated : p))
      onToast(newVisibility === 'public' ? t('library.made_public') : t('library.made_private'))
    } catch (err: unknown) {
      if (err instanceof Error) {
        onToast(err.message || t('library.update_error'))
      } else {
        onToast(t('library.update_error'))
      }
    }
  }

  const handleShare = async (projectId: string, title: string) => {
    const url = `${window.location.origin}/dublajlar?dub=${encodeURIComponent(projectId)}`
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        return
      }
      await navigator.clipboard.writeText(url)
      onToast(t('video.link_copied'))
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      onToast(t('action.failed'))
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 flex justify-center">
        <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0 pb-24">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-white tracking-tight">{t('library.title')}</h1>
          <p className="text-zinc-400 mt-2">{t('library.empty_subtitle')}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] py-24 px-4 flex flex-col items-center text-center mb-12">
          <h3 className="text-lg font-bold text-white mb-2">{t('library.empty_title')}</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-8">
            {t('library.empty_desc')}
          </p>
          <button onClick={() => setActiveTab('play')} className="px-6 py-2.5 rounded-xl bg-lime text-black text-sm font-bold hover:brightness-110 transition">
            {t('preview.upload_own')}
          </button>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">
              {t('membership.lab_vip')}
            </div>
            <h2 className="text-2xl font-black text-white">{t('membership.hero')}</h2>
            <p className="text-sm text-zinc-400 mt-2">{t('promo.vip_desc')}</p>
          </div>
          <button onClick={() => setActiveTab('membership')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition shrink-0">
            {t('nav.vip_join')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      {preview && (
        <VideoPreviewModal
          sourceUrl={preview.sourceUrl}
          title={preview.title}
          retentionLabel={preview.retentionLabel}
          onClose={() => setPreview(null)}
          onShare={preview.isPublic ? () => void handleShare(preview.projectId, preview.title) : undefined}
        />
      )}
      <div className="mb-12">
        <h1 className="break-words text-3xl font-black tracking-tight text-white">{t('library.title')}</h1>
        <p className="mt-2 break-words text-zinc-400">{t('library.subtitle').replace('{count}', String(projects.length))}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => {
          const relatedExport = exports.find(e => e.project_id === project.id)
          const mediaUrl = relatedExport?.download_url
            ? absoluteApiUrl(relatedExport.download_url)
            : ''
          const retentionLabel = relatedExport?.retention_expires_at
            ? t('library.retention_until').replace(
                '{date}',
                new Date(relatedExport.retention_expires_at).toLocaleString(
                  language === 'TR' ? 'tr-TR' : 'en-US',
                  { dateStyle: 'medium', timeStyle: 'short' },
                ),
              )
            : t('library.retention_permanent')
          const dateStr = new Date(project.created_at).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })

          return (
            <div key={project.id} className="flex min-w-0 flex-col items-stretch gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
              <div className="w-full flex-shrink-0 sm:w-40">
                {mediaUrl ? (
                  <VideoThumbnail
                    sourceUrl={mediaUrl}
                    title={project.title}
                    onOpen={() => setPreview({ sourceUrl: mediaUrl, title: project.title, retentionLabel, projectId: project.id, isPublic: project.visibility === 'public' })}
                  />
                ) : (
                  <div className="grid aspect-video place-items-center rounded-xl bg-black/40">
                    <Play className="h-8 w-8 text-white/25" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="break-words text-lg font-semibold leading-6 text-white sm:truncate" title={project.title}>
                  {project.title}
                </h3>
                <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/50">
                  <span className="flex min-w-0 items-start gap-1.5">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="min-w-0 break-words">{dateStr}</span>
                  </span>
                  {project.status === 'completed' && (
                    <span className="flex items-center gap-1.5 text-lime-400">
                      <CheckCircle2 className="w-4 h-4" />
                      {t('library.status_completed')}
                    </span>
                  )}
                  {project.status === 'processing' && (
                    <span className="flex items-center gap-1.5 text-blue-400 animate-pulse">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('library.status_processing')}
                    </span>
                  )}
                  {project.status === 'failed' && (
                    <span className="flex items-center gap-1.5 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      {t('library.status_failed')}
                    </span>
                  )}
                </div>
                {project.moderation_status !== 'visible' && (
                  <p className="mt-3 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-3 py-2 text-xs leading-5 text-amber-100/80">
                    {t('library.moderation_hidden')}{' '}
                    <a
                      className="underline"
                      href={`mailto:destek@dublajlab.com.tr?subject=${encodeURIComponent(`İçerik incelemesi ${project.id}`)}`}
                    >
                      {t('library.moderation_appeal')}
                    </a>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-2 grid w-full min-w-0 grid-cols-2 gap-2 sm:mt-0 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
                {project.status === 'completed' && relatedExport && (
                  relatedExport.download_url ? (
                    <>
                      <button
                        onClick={() => handleToggleVisibility(project, relatedExport)}
                        className={`flex min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-sm font-medium leading-5 transition-colors ${project.visibility === 'public' ? 'bg-lime-400/10 text-lime-400 border-lime-400/30 hover:bg-lime-400/20' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'}`}
                        title={project.visibility === 'public' ? t('library.public_tooltip') : t('library.private_tooltip')}
                      >
                        {project.visibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <span className="min-w-0 break-words">{project.visibility === 'public' ? t('library.public') : t('library.private')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreview({ sourceUrl: mediaUrl, title: project.title, retentionLabel, projectId: project.id, isPublic: project.visibility === 'public' })}
                        className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center text-sm font-bold text-zinc-200 transition hover:bg-white/10"
                      >
                        <Play className="h-4 w-4 fill-current" />
                        {t('library.play')}
                      </button>
                      <a
                        href={mediaUrl}
                        download
                        className="flex min-w-0 items-center justify-center gap-2 rounded-xl bg-lime px-3 py-2 text-center text-sm font-extrabold text-ink transition-colors hover:brightness-110"
                      >
                        <Download className="w-4 h-4" />
                        {t('library.download')}
                      </a>
                      {project.visibility === 'public' && (
                        <button
                          type="button"
                          onClick={() => void handleShare(project.id, project.title)}
                          className="flex min-w-0 items-center justify-center gap-2 rounded-xl border border-lime/25 bg-lime/10 px-3 py-2 text-center text-sm font-bold text-lime transition hover:bg-lime/20"
                        >
                          <Share2 className="h-4 w-4 shrink-0" />
                          <span className="min-w-0 break-words">{t('library.share')}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-400 font-medium rounded-xl cursor-not-allowed" title={t('library.file_expired_desc')}>
                      <AlertCircle className="w-4 h-4" />
                      {t('library.status_expired')}
                    </div>
                  )
                )}
                <button
                  onClick={() => handleDelete(project.id)}
                  className="col-span-2 justify-self-end rounded-xl p-2 text-white/40 transition-colors hover:bg-red-400/10 hover:text-red-400 sm:col-span-1"
                  title={t('library.delete')}
                  aria-label={t('library.delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6 mt-12">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">
            {t('membership.lab_vip')}
          </div>
          <h2 className="text-2xl font-black text-white">{t('membership.hero')}</h2>
          <p className="text-sm text-zinc-400 mt-2">{t('promo.vip_desc')}</p>
        </div>
        <button onClick={() => setActiveTab('membership')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition shrink-0">
          {t('nav.vip_join')}
        </button>
      </div>
    </div>
  )
}
