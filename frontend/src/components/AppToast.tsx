import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

export type ToastKind = 'info' | 'success' | 'warning' | 'error'

interface AppToastProps {
  message: string
  kind?: ToastKind
  dismissLabel: string
  onDismiss: () => void
}

const toastStyles: Record<ToastKind, { border: string; icon: string; Icon: typeof Info }> = {
  info: {
    border: 'border-violet-400/35',
    icon: 'bg-violet-400/15 text-violet-200',
    Icon: Info,
  },
  success: {
    border: 'border-emerald-400/35',
    icon: 'bg-emerald-400/15 text-emerald-300',
    Icon: CheckCircle2,
  },
  warning: {
    border: 'border-amber-400/40',
    icon: 'bg-amber-400/15 text-amber-300',
    Icon: TriangleAlert,
  },
  error: {
    border: 'border-red-400/40',
    icon: 'bg-red-400/15 text-red-300',
    Icon: AlertCircle,
  },
}

export function AppToast({ message, kind = 'info', dismissLabel, onDismiss }: AppToastProps) {
  const { border, icon, Icon } = toastStyles[kind]

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top)+4.75rem)] z-[100] flex justify-center sm:top-[calc(env(safe-area-inset-top)+5.25rem)]">
      <div
        role={kind === 'error' ? 'alert' : 'status'}
        aria-live={kind === 'error' ? 'assertive' : 'polite'}
        className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border ${border} bg-[#15131d]/95 px-4 py-3.5 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl animate-in fade-in slide-in-from-top-3`}
      >
        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${icon}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <p className="min-w-0 flex-1 break-words pt-1 text-sm font-semibold leading-5">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
