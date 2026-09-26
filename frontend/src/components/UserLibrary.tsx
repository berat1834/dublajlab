import { useEffect, useState } from 'react'
import { Download, Play, Trash2, Clock, CheckCircle2, AlertCircle, Globe, Lock } from 'lucide-react'
import { getUserProjects, getUserExports, deleteUserProject, updateProjectVisibility, absoluteApiUrl } from '../lib/api'
import type { DubbingProject, DubbingExport } from '../types'

interface UserLibraryProps {
  onToast: (msg: string) => void
  setActiveTab: (tab: any) => void
}

export function UserLibrary({ onToast, setActiveTab }: UserLibraryProps) {
  const [projects, setProjects] = useState<DubbingProject[]>([])
  const [exports, setExports] = useState<DubbingExport[]>([])
  const [loading, setLoading] = useState(true)

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
        onToast('Projeler yüklenirken hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [onToast])

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return
    try {
      await deleteUserProject(projectId)
      onToast('Proje silindi.')
      setProjects(projects.filter(p => p.id !== projectId))
      setExports(exports.filter(e => e.project_id !== projectId))
    } catch (err: unknown) {
      if (err instanceof Error) {
        onToast(err.message || 'Silme işlemi başarısız.')
      } else {
        onToast('Silme işlemi başarısız.')
      }
    }
  }

  const handleToggleVisibility = async (project: DubbingProject, relatedExport?: DubbingExport) => {
    if (project.status !== 'completed' || !relatedExport?.download_url) return
    const newVisibility = project.visibility === 'public' ? 'private' : 'public'
    try {
      const updated = await updateProjectVisibility(project.id, newVisibility)
      setProjects(projects.map(p => p.id === project.id ? updated : p))
      onToast(newVisibility === 'public' ? 'Proje herkese açık yapıldı.' : 'Proje gizlendi.')
    } catch (err: unknown) {
      if (err instanceof Error) {
        onToast(err.message || 'Güncelleme başarısız.')
      } else {
        onToast('Güncelleme başarısız.')
      }
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
          <h1 className="text-3xl font-black text-white tracking-tight">Dublajlarım</h1>
          <p className="text-zinc-400 mt-2">Yer aldığın 0 dublaj. İzle, indir ya da stüdyoda yeniden miksle.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] py-24 px-4 flex flex-col items-center text-center mb-12">
          <h3 className="text-lg font-bold text-white mb-2">Henüz dublajın yok</h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-8">
            Bir oda kur, arkadaşlarını çağır — ilk dublajın burada görünsün.
          </p>
          <button onClick={() => setActiveTab('oda_kur')} className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition">
            Oda kur
          </button>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">
              DublajLab VIP
            </div>
            <h2 className="text-2xl font-black text-white">Dublaj daha hızlı, daha yüksek kalitede.</h2>
            <p className="text-sm text-zinc-400 mt-2">VIP üyelik ile sahneleri açar, render sırasını atlar ve 1080p çıktı alırsın.</p>
          </div>
          <button onClick={() => setActiveTab('membership')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition shrink-0">
            VIP Ol
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-white tracking-tight">Dublajlarım</h1>
        <p className="text-zinc-400 mt-2">Yer aldığın {projects.length} dublaj. İzle, indir ya da stüdyoda yeniden miksle.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => {
          const relatedExport = exports.find(e => e.project_id === project.id)
          const dateStr = new Date(project.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })

          return (
            <div key={project.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center transition-colors hover:bg-white/10">
              {/* Thumbnail Placeholder */}
              <div className="w-full sm:w-40 aspect-video bg-black/40 rounded-xl flex items-center justify-center flex-shrink-0 relative overflow-hidden group">
                <Play className="w-8 h-8 text-white/40 group-hover:text-lime-400 group-hover:scale-110 transition-all" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate" title={project.title}>
                  {project.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {dateStr}
                  </span>
                  {project.status === 'completed' && (
                    <span className="flex items-center gap-1.5 text-lime-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Tamamlandı
                    </span>
                  )}
                  {project.status === 'processing' && (
                    <span className="flex items-center gap-1.5 text-blue-400 animate-pulse">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      İşleniyor
                    </span>
                  )}
                  {project.status === 'failed' && (
                    <span className="flex items-center gap-1.5 text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      Başarısız
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-wrap justify-end">
                {project.status === 'completed' && relatedExport && (
                  relatedExport.download_url ? (
                    <>
                      <button
                        onClick={() => handleToggleVisibility(project, relatedExport)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors border ${project.visibility === 'public' ? 'bg-lime-400/10 text-lime-400 border-lime-400/30 hover:bg-lime-400/20' : 'bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10'}`}
                        title={project.visibility === 'public' ? 'Şu an herkese açık. Gizlemek için tıkla.' : 'Herkese açık yaptığında Dublajlar sayfasında görünür.'}
                      >
                        {project.visibility === 'public' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        <span className="hidden sm:inline">{project.visibility === 'public' ? 'Açık' : 'Gizli'}</span>
                      </button>
                      <a
                        href={absoluteApiUrl(relatedExport.download_url)}
                        download
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-lime-400 text-black font-medium rounded-xl hover:bg-lime-500 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        İndir
                      </a>
                    </>
                  ) : (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-zinc-400 font-medium rounded-xl cursor-not-allowed" title="Dosya sunucudan silinmiş (Süre aşımı)">
                      <AlertCircle className="w-4 h-4" />
                      Süresi Dolmuş
                    </div>
                  )
                )}
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                  title="Projeyi Sil"
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
            DublajLab VIP
          </div>
          <h2 className="text-2xl font-black text-white">Dublaj daha hızlı, daha yüksek kalitede.</h2>
          <p className="text-sm text-zinc-400 mt-2">VIP üyelik ile sahneleri açar, render sırasını atlar ve 1080p çıktı alırsın.</p>
        </div>
        <button onClick={() => setActiveTab('membership')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition shrink-0">
          VIP Ol
        </button>
      </div>
    </div>
  )
}
