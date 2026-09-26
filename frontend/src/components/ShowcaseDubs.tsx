import { useEffect, useState } from 'react'
import { Play, CheckCircle2, MessageSquare, Download, Flag } from 'lucide-react'
import { getPublicDubs, toggleLikePublicDub, recordViewPublicDub, type PublicDub, absoluteApiUrl } from '../lib/api'
import { ReportModal } from './ReportModal'
import { PublicDubComments } from './PublicDubComments'

export function ShowcaseDubs({ onToast }: { onToast: (msg: string) => void }) {
  const [dubs, setDubs] = useState<PublicDub[]>([])
  const [loading, setLoading] = useState(true)
  const [reportingProjectId, setReportingProjectId] = useState<string | null>(null)
  const [commentingProjectId, setCommentingProjectId] = useState<string | null>(null)

  useEffect(() => {
    const fetchDubs = async () => {
      try {
        const data = await getPublicDubs()
        setDubs(data)
      } catch {
        // Silently fail on network error for MVP
      } finally {
        setLoading(false)
      }
    }
    fetchDubs()
  }, [])

  const handleLikeToggle = async (dub: PublicDub) => {
    if (!localStorage.getItem('token')) {
      onToast('Beğenmek için giriş yapmalısınız.')
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
      onToast('İşlem başarısız.')
    }
  }

  const handlePlayDub = (projectId: string) => {
    recordViewPublicDub(projectId).catch(() => {})
    setDubs(currentDubs => currentDubs.map(d =>
      d.project_id === projectId ? { ...d, view_count: d.view_count + 1 } : d
    ))
    onToast('Video oynatma simülasyonu başlatıldı.')
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
        />
      )}
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Dublajlar</h1>
        <p className="mt-3 text-zinc-400">Topluluğun kaydettiği efsane dublajları keşfet.</p>
        {dubs.length === 0 && !loading && (
          <div className="mt-3 inline-block rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-200/80">
            ⚠️ Bu alan canlı demo için örnek (placeholder) içeriklerle gösterilmektedir.
          </div>
        )}
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
                  <button onClick={() => setReportingProjectId(dub.project_id)} className="text-zinc-500 hover:text-red-400 transition" title="İçeriği Raporla">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{dub.display_name} • {new Date(dub.created_at).toLocaleDateString('tr-TR')}</p>
                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-zinc-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1" title="İzlenme Sayısı">
                      <CheckCircle2 className="h-3 w-3" /> {dub.view_count}
                    </span>
                    <button
                      onClick={() => handleLikeToggle(dub)}
                      className={`flex items-center gap-1 transition ${dub.liked_by_me ? 'text-red-500 hover:text-red-400' : 'hover:text-red-400'}`}
                      title={dub.liked_by_me ? "Beğeniyi Geri Al" : "Beğen"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill={dub.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      {dub.like_count}
                    </button>
                    <button
                      onClick={() => setCommentingProjectId(dub.project_id)}
                      className="flex items-center gap-1 hover:text-lime-400 transition"
                      title="Yorumlar"
                    >
                      <MessageSquare className="h-3 w-3" /> Yorumlar
                    </button>
                  </div>
                  {dub.download_url && (
                    <a href={absoluteApiUrl(dub.download_url)} download className="p-1.5 bg-lime-400/10 text-lime-400 rounded-md hover:bg-lime-400/20 transition" title="İndir">
                      <Download className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-card transition hover:border-white/20 opacity-50 grayscale">
              <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center">
                <Play className="h-10 w-10 text-white/40 group-hover:text-lime transition group-hover:scale-110" />
                <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Komedi</span>
                <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-white">0:15</span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white line-clamp-1">Demo Dublaj #{i}</h3>
                <p className="mt-1 text-xs text-zinc-500">Oyuncu{i}99</p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-zinc-400">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {i * 120}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {i * 12}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
