import { AlertCircle, RefreshCw } from 'lucide-react'

interface JobFailurePanelProps {
  message: string
  onRetry: () => void
}

export function JobFailurePanel({ message, onRetry }: JobFailurePanelProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mt-4 rounded-xl border border-red-400/30 bg-red-400/[0.09] p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-red-200">Video oluşturulamadı</p>
          <p className="mt-1 break-words text-sm leading-5 text-red-100/90">
            {message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border border-red-300/20 bg-red-300/10 px-4 py-2.5 text-xs font-bold text-red-100 transition hover:bg-red-300/15"
      >
        <RefreshCw className="h-3.5 w-3.5" /> Export’u tekrar dene
      </button>
    </div>
  )
}
