import { useLanguage } from '../LanguageContext'
import { useEffect, useState } from 'react'
import { getAdminAuditLogs, getAdminOpsMetrics, getAdminUsers, updateUserMembership, type AdminAuditLog, type AdminOpsMetrics } from '../lib/api'
import type { User } from '../types'
import { Activity, Database, HardDrive, CheckCircle2, XCircle, Users, FileVideo, AlertCircle, RefreshCw, Search, Server } from 'lucide-react'

interface AdminOpsPanelProps {
  onToast: (msg: string) => void
}

export function AdminOpsPanel({ onToast }: AdminOpsPanelProps) {
  const { t, language } = useLanguage()
  const locale = language === 'TR' ? 'tr-TR' : 'en-US'
  const [metrics, setMetrics] = useState<AdminOpsMetrics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([])
  const [userQuery, setUserQuery] = useState('')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshDashboard = async (query = userQuery) => {
    try {
      setLoading(true)
      const [metricData, userData, auditData] = await Promise.all([
        getAdminOpsMetrics(),
        getAdminUsers(query),
        getAdminAuditLogs(),
      ])
      setMetrics(metricData)
      setUsers(userData)
      setAuditLogs(auditData)
      setLastUpdatedAt(new Date())
    } catch {
      onToast(t('admin.metrics_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshDashboard('')
    // Initial load only; manual controls refresh subsequent data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const changeMembership = async (user: User, tier: 'free' | 'vip') => {
    try {
      const updated = await updateUserMembership(user.id, tier, 30)
      setUsers((items) => items.map((item) => item.id === user.id ? updated : item))
      onToast(tier === 'vip' ? t('admin.vip_granted') : t('admin.vip_removed'))
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : t('admin.membership_error'))
    }
  }

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
        {t('admin.data_load_failed')}
      </div>
    )
  }

  const StatusIcon = ({ ok }: { ok: boolean }) => ok ? 
    <CheckCircle2 className="w-5 h-5 text-lime-500" /> : 
    <XCircle className="w-5 h-5 text-red-500" />

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
        <div className="p-3 bg-violet-500/10 rounded-xl">
          <Activity className="w-6 h-6 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">{t('admin.panel_title')}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t('admin.subtitle')}</p>
        </div>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdatedAt && <span className="text-xs text-zinc-500">{t('admin.last_update')}: {lastUpdatedAt.toLocaleTimeString(locale)}</span>}
          <button type="button" onClick={() => void refreshDashboard()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-white/5">
            <RefreshCw className="h-3.5 w-3.5" /> {t('admin.refresh')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {/* System Health */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-violet-400" /> {t('admin.infra')}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.db')}</span>
              <StatusIcon ok={metrics.database_connected} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Redis</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">{metrics.redis_configured ? t('admin.on') : t('admin.off')}</span>
                {metrics.redis_configured && <StatusIcon ok={metrics.redis_connected} />}
              </div>
            </div>
            {metrics.redis_error && <p className="text-right text-[10px] text-red-300">Redis: {metrics.redis_error}</p>}
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
              <span className="text-zinc-400">{t('admin.write_perm')}</span>
              <StatusIcon ok={metrics.media_root_writable} />
            </div>
          </div>
        </div>

        {/* Users */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" /> {t('admin.users')}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.total_users')}</span>
              <span className="text-white font-mono">{metrics.total_users}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.vip_users')}</span>
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
              <span className="text-zinc-400">{t('admin.total_projects')}</span>
              <span className="text-white font-mono">{metrics.total_projects}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.success_export')}</span>
              <span className="text-lime-400 font-mono">{metrics.completed_exports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.failed_export')}</span>
              <span className="text-red-400 font-mono">{metrics.failed_exports}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.public_shares')}</span>
              <span className="text-cyan-400 font-mono">{metrics.public_dubs_count}</span>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-green-400" /> {t('admin.payments')}
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.paid')}</span>
              <span className="text-lime-400 font-mono">{metrics.paid_payments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.pending')}</span>
              <span className="text-amber-400 font-mono">{metrics.pending_payments}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">{t('admin.failed_pay')}</span>
              <span className="text-red-400 font-mono">{metrics.failed_payments}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{t('admin.user_management')}</h2>
            <p className="mt-1 text-xs text-zinc-500">{t('admin.user_management_hint')}</p>
          </div>
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void refreshDashboard(userQuery) }}>
            <input value={userQuery} onChange={(event) => setUserQuery(event.target.value)} placeholder={t('admin.search_users')} className="min-w-0 rounded-lg border border-white/10 bg-black px-3 py-2 text-sm text-white" />
            <button type="submit" className="rounded-lg border border-white/10 p-2 text-zinc-300 hover:bg-white/5" aria-label={t('admin.search_users')}><Search className="h-4 w-4" /></button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm text-zinc-300">
            <thead className="bg-white/5 text-xs uppercase text-zinc-500"><tr><th className="px-5 py-3">{t('account.username')}</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">{t('drop.membership')}</th><th className="sticky right-0 bg-zinc-900 px-5 py-3 text-right">{t('admin.action')}</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => <tr key={user.id}><td className="px-5 py-3 font-semibold text-white">{user.display_name}</td><td className="px-5 py-3">{user.email}</td><td className="px-5 py-3">{user.has_active_vip ? 'VIP' : 'Free'}</td><td className="sticky right-0 bg-zinc-900 px-5 py-3 text-right"><button type="button" onClick={() => void changeMembership(user, user.has_active_vip ? 'free' : 'vip')} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/5">{user.has_active_vip ? t('admin.remove_vip') : t('admin.grant_vip')}</button></td></tr>)}
              {!users.length && <tr><td colSpan={4} className="px-5 py-8 text-center text-zinc-500">{t('admin.no_users')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <div className="border-b border-white/10 p-5"><h2 className="font-bold text-white">{t('admin.audit_logs')}</h2></div>
        <div className="max-h-80 divide-y divide-white/5 overflow-y-auto">
          {auditLogs.map((log) => <div key={log.id} className="grid gap-1 px-5 py-3 text-xs sm:grid-cols-[160px_1fr_1fr]"><span className="text-zinc-500">{new Date(log.created_at).toLocaleString(locale)}</span><span className="font-bold text-zinc-200">{log.action}</span><span className="break-all text-zinc-500">{log.target_type}:{log.target_id}</span></div>)}
          {!auditLogs.length && <p className="p-6 text-center text-sm text-zinc-500">{t('admin.no_audit_logs')}</p>}
        </div>
      </div>

      {/* Recent Failed Jobs */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden mb-8">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" /> {t('admin.recent_failed')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs text-zinc-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('common.project_id')}</th>
                <th className="px-6 py-4 font-semibold">{t('common.date')}</th>
                <th className="px-6 py-4 font-semibold">{t('admin.title')}</th>
                <th className="px-6 py-4 font-semibold">{t('mod.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {metrics.recent_failed_jobs.map(job => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{job.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.created_at ? new Date(job.created_at).toLocaleString(locale) : '-'}
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
                    {t('admin.no_recent_errors')}
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
