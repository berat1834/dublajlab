import { ArrowRight, Coins } from 'lucide-react'
import type { Tab } from '../types'
import { useLanguage } from '../LanguageContext'

interface UserCreditsProps { setActiveTab: (tab: Tab) => void }

export function UserCredits({ setActiveTab }: UserCreditsProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10"><Coins className="h-8 w-8 text-amber-300" /></div>
      <span className="mt-6 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-300">{t('preview.badge')}</span>
      <h1 className="mt-4 text-3xl font-black text-white">{t('preview.credits_title')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">{t('preview.credits_desc')}</p>
      <button type="button" onClick={() => setActiveTab('membership')} className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white hover:bg-white/10">{t('preview.view_membership')} <ArrowRight className="h-4 w-4" /></button>
    </div>
  )
}
