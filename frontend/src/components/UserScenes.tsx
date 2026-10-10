import { ArrowRight, Film } from 'lucide-react'
import type { Tab } from '../types'
import { useLanguage } from '../LanguageContext'

interface UserScenesProps { setActiveTab: (tab: Tab) => void }

export function UserScenes({ setActiveTab }: UserScenesProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10"><Film className="h-8 w-8 text-cyan-300" /></div>
      <span className="mt-6 inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-300">{t('preview.badge')}</span>
      <h1 className="mt-4 text-3xl font-black text-white">{t('preview.scenes_title')}</h1>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">{t('preview.scenes_desc')}</p>
      <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-zinc-500">{t('preview.rights_notice')}</p>
      <button type="button" onClick={() => setActiveTab('play')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 text-sm font-black text-ink">{t('preview.upload_own')} <ArrowRight className="h-4 w-4" /></button>
    </div>
  )
}
