import { useEffect, useState } from 'react'
import { getAdminReports, updateReportStatus, updateProjectModeration, type ContentReport } from '../lib/api'
import { Shield, EyeOff, X } from 'lucide-react'

interface AdminModerationPanelProps {
  onToast: (msg: string) => void
}

export function AdminModerationPanel({ onToast }: AdminModerationPanelProps) {
  const [reports, setReports] = useState<ContentReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const data = await getAdminReports()
        setReports(data)
      } catch {
        onToast('Raporlar yüklenemedi.')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [onToast])

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      const updated = await updateReportStatus(reportId, status)
      setReports(reports.map(r => r.id === reportId ? updated : r))
      onToast('Rapor durumu güncellendi.')
    } catch {
      onToast('İşlem başarısız.')
    }
  }

  const handleHideProject = async (projectId: string, reportId: string) => {
    if (!window.confirm('Bu projeyi gizlemek istediğinize emin misiniz?')) return
    try {
      await updateProjectModeration(projectId, 'hidden')
      await handleUpdateStatus(reportId, 'action_taken')
      onToast('Proje gizlendi ve rapor kapatıldı.')
    } catch {
      onToast('Proje gizlenemedi.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 flex justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-500/10 rounded-xl">
          <Shield className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Moderasyon Paneli</h1>
          <p className="text-sm text-zinc-400 mt-1">Kullanıcı bildirimlerini ve şüpheli içerikleri yönetin.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs text-zinc-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Tarih</th>
                <th className="px-6 py-4 font-semibold">Sebep</th>
                <th className="px-6 py-4 font-semibold">Detay</th>
                <th className="px-6 py-4 font-semibold">Proje ID</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
                <th className="px-6 py-4 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(report.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-white">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate" title={report.details || ''}>
                    {report.details || '-'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">
                    {report.project_id.split('-')[0]}...
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      report.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      report.status === 'action_taken' ? 'bg-red-500/10 text-red-500' :
                      report.status === 'dismissed' ? 'bg-zinc-500/10 text-zinc-500' :
                      'bg-lime-500/10 text-lime-500'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {report.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleHideProject(report.project_id, report.id)}
                          className="p-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Projeyi Gizle"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          className="p-2 text-white/60 hover:text-zinc-300 hover:bg-white/10 rounded-lg transition-colors"
                          title="Raporu Reddet (Görmezden Gel)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Bekleyen veya geçmiş rapor bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
