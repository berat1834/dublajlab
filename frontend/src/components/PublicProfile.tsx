import { ArrowRight, Settings } from 'lucide-react'
import type { User, Tab } from '../types'
import { useLanguage } from '../LanguageContext'

interface PublicProfileProps { currentUser: User; setActiveTab: (tab: Tab) => void }

export function PublicProfile({ currentUser, setActiveTab }: PublicProfileProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-24">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl bg-lime/15 text-2xl font-black text-lime">
            {currentUser.avatar_url ? <img src={currentUser.avatar_url} alt="" className="h-full w-full object-cover" /> : currentUser.display_name.charAt(0).toUpperCase()}
          </div>
          <div><h1 className="text-3xl font-black text-white">{currentUser.display_name}</h1><p className="mt-1 text-sm text-zinc-500">{currentUser.has_active_vip ? 'VIP' : 'Free'} · DublajLab</p></div>
        </div>
        <button type="button" onClick={() => setActiveTab('account')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/5"><Settings className="h-4 w-4" /> {t('account.edit_title')}</button>
      </div>
      <div className="mt-10 rounded-2xl border border-dashed border-white/10 px-5 py-14 text-center">
        <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-300">{t('preview.badge')}</span>
        <h2 className="mt-4 text-xl font-black text-white">{t('preview.profile_title')}</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">{t('preview.profile_desc')}</p>
        <button type="button" onClick={() => setActiveTab('library')} className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-lime">{t('drop.library')} <ArrowRight className="h-4 w-4" /></button>
      </div>
    </div>
  )
}
