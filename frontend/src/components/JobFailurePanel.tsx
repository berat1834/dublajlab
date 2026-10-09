import { AlertCircle } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

interface JobFailurePanelProps {
  message: string
}

export function JobFailurePanel({ message }: JobFailurePanelProps) {
  const { t } = useLanguage()
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-4 rounded-xl border border-red-400/30 bg-red-400/[0.09] p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-red-200">{t('job.failed')}</p>
          <p className="mt-1 break-words text-sm leading-5 text-red-100/90">
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}
