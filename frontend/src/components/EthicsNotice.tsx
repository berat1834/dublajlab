import { ShieldAlert } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

export function EthicsNotice() {
  const { t } = useLanguage()
  return (
    <aside className="mt-8 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet">
          <ShieldAlert className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-xs font-bold text-zinc-300">{t('ethics.title')}</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {t('ethics.description')}
          </p>
        </div>
      </div>
    </aside>
  )
}
