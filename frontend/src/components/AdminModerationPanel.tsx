import { useLanguage } from '../LanguageContext'
import { useEffect, useState } from 'react'
import { getAdminComments, getAdminReports, hideAdminComment, updateReportStatus, updateProjectModeration, type AdminComment, type ContentReport } from '../lib/api'
import { MessageSquareOff, Shield, EyeOff, X } from 'lucide-react'

interface AdminModerationPanelProps {
  onToast: (msg: string) => void
}

export function AdminModerationPanel({ onToast }: AdminModerationPanelProps) {
  const { t, language } = useLanguage()
  const [reports, setReports] = useState<ContentReport[]>([])
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true)
        const [reportData, commentData] = await Promise.all([getAdminReports(), getAdminComments()])
        setReports(reportData)
        setComments(commentData)
      } catch {
        onToast(t('mod.reports_error'))
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [onToast, t])

  const handleUpdateStatus = async (reportId: string, status: string) => {
    try {
      const updated = await updateReportStatus(reportId, status)
      setReports(reports.map(r => r.id === reportId ? updated : r))
      onToast(t('mod.status_updated'))
    } catch {
      onToast(t('mod.action_failed'))
    }
  }

  const handleHideProject = async (projectId: string, reportId: string) => {
    if (!window.confirm(t('mod.hide_confirm'))) return
    try {
      await updateProjectModeration(projectId, 'hidden')
      await handleUpdateStatus(reportId, 'action_taken')
      onToast(t('mod.hidden_success'))
    } catch {
      onToast(t('mod.action_failed'))
    }
  }

  const handleHideComment = async (commentId: string) => {
    if (!window.confirm(t('mod.comment_hide_confirm'))) return
    try {
      await hideAdminComment(commentId)
      setComments((items) => items.filter((comment) => comment.id !== commentId))
      onToast(t('mod.comment_hidden'))
    } catch {
      onToast(t('mod.action_failed'))
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
          <h1 className="text-2xl font-black text-white tracking-tight">{t('mod.panel_title')}</h1>
          <p className="text-sm text-zinc-400 mt-1">{t('mod.subtitle')}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="text-xs text-zinc-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-semibold">{t('common.date')}</th>
                <th className="px-6 py-4 font-semibold">{t('mod.reason')}</th>
                <th className="px-6 py-4 font-semibold">{t('common.details')}</th>
                <th className="px-6 py-4 font-semibold">{t('common.project_id')}</th>
                <th className="px-6 py-4 font-semibold">{t('mod.status')}</th>
                <th className="px-6 py-4 font-semibold text-right">{t('admin.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(report.created_at).toLocaleDateString(language === 'TR' ? 'tr-TR' : 'en-US')}
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
                          title={t('mod.hide_project')}
                          aria-label={t('mod.hide_project')}
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                          className="p-2 text-white/60 hover:text-zinc-300 hover:bg-white/10 rounded-lg transition-colors"
                          title={t('admin.reject_report')}
                          aria-label={t('admin.reject_report')}
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
                    {t('admin.no_reports')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        <div className="border-b border-white/10 p-5"><h2 className="font-bold text-white">{t('mod.visible_comments')}</h2></div>
        <div className="divide-y divide-white/5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start justify-between gap-4 p-5">
              <div className="min-w-0"><p className="text-xs font-bold text-zinc-400">{comment.display_name}</p><p className="mt-1 break-words text-sm text-white">{comment.body}</p><p className="mt-2 text-[10px] text-zinc-600">{new Date(comment.created_at).toLocaleString(language === 'TR' ? 'tr-TR' : 'en-US')}</p></div>
              <button type="button" onClick={() => void handleHideComment(comment.id)} className="shrink-0 rounded-lg p-2 text-zinc-400 hover:bg-red-400/10 hover:text-red-300" aria-label={t('mod.hide_comment')} title={t('mod.hide_comment')}><MessageSquareOff className="h-4 w-4" /></button>
            </div>
          ))}
          {!comments.length && <p className="p-6 text-center text-sm text-zinc-500">{t('mod.no_comments')}</p>}
        </div>
      </div>
    </div>
  )
}
