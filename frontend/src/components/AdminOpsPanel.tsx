import { useEffect, useState } from 'react'
import { getAdminOpsMetrics, type AdminOpsMetrics } from '../lib/api'
import { Activity, Database, HardDrive, CheckCircle2, XCircle, Users, FileVideo, AlertCircle, Server } from 'lucide-react'

interface AdminOpsPanelProps {
  onToast: (msg: string) => void
}

export function AdminOpsPanel({ onToast }: AdminOpsPanelProps) {
  const [metrics, setMetrics] = useState<AdminOpsMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await getAdminOpsMetrics()
        setMetrics(data)
      } catch {
        onToast('Sistem metrikleri alınamadı.')
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [onToast])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 flex justify-center">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 flex justify-center text-zinc-400">
        Veri yüklenemedi.
      </div>
    )
  }

  const StatusIcon = ({ ok }: { ok: boolean }) => ok ? 
    <CheckCircle2 className="w-5 h-5 text-lime-500" /> : 
    <XCircle className="w-5 h-5 text-red-500" />

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-violet-500/10 rounded-xl">
          <Activity className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sistem Durumu (Ops)</h1>
          <p className="text-sm text-zinc-400 mt-1">Uygulama sağlığı ve temel metrikler.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* System Health */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-violet-400" /> Altyapı
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Veritabanı</span>
              <StatusIcon ok={metrics.database_connected} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Redis</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{metrics.redis_configured ? 'Açık' : 'Kapalı'}</span>
                {metrics.redis_configured && <StatusIcon ok={metrics.redis_connected} />}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">FFmpeg / FFprobe</span>
              <StatusIcon ok={metrics.ffmpeg_available && metrics.ffprobe_available} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Shopier Webhook</span>
              <StatusIcon ok={metrics.shopier_enabled} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Lip-Sync</span>
              <span className={`text-xs px-2 py-1 rounded-md font-bold ${metrics.lipsync_enabled ? 'bg-lime-500/10 text-lime-500' : 'bg-zinc-500/10 text-zinc-400'}`}>
                {metrics.lipsync_provider.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Media Storage */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" /> Depolama
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Volume (/app/media)</span>
              <StatusIcon ok={metrics.media_root_exists} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Yazma İzni</span>
              <StatusIcon ok={metrics.media_root_writable} />
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> Kullanıcılar
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Toplam Kullanıcı</span>
              <span className="text-white font-mono">{metrics.total_users}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Aktif VIP Kullanıcı</span>
              <span className="text-lime-400 font-mono font-bold">{metrics.active_vip_users}</span>
            </div>
          </div>
        </div>

        {/* Projects / Exports */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-rose-400" /> Projeler
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Toplam Proje</span>
              <span className="text-white font-mono">{metrics.total_projects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Başarılı Export</span>
              <span className="text-lime-400 font-mono">{metrics.completed_exports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Hatalı Export</span>
              <span className="text-red-400 font-mono">{metrics.failed_exports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Açık Paylaşımlar</span>
              <span className="text-cyan-400 font-mono">{metrics.public_dubs_count}</span>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-400" /> Ödemeler (Shopier)
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Başarılı (Paid)</span>
              <span className="text-lime-400 font-mono">{metrics.paid_payments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Bekleyen (Pending)</span>
              <span className="text-amber-400 font-mono">{metrics.pending_payments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Başarısız (Failed)</span>
              <span className="text-red-400 font-mono">{metrics.failed_payments}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Failed Jobs */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> Son Hata Alan Projeler
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs text-zinc-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">Proje ID</th>
                <th className="px-6 py-4 font-semibold">Tarih</th>
                <th className="px-6 py-4 font-semibold">Başlık</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics.recent_failed_jobs.map(job => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.created_at ? new Date(job.created_at).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 text-white truncate max-w-[200px]" title={job.title}>
                    {job.title}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500">
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
              {metrics.recent_failed_jobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Son zamanlarda hata alan proje bulunamadı.
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
