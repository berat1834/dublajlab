import { Crown, Play } from 'lucide-react'
import type { Tab } from '../types'
import { useLanguage } from '../LanguageContext'

interface DailyDubProps {
  setActiveTab: (tab: Tab) => void
}

export function DailyDub({ setActiveTab }: DailyDubProps) {
  const { t } = useLanguage()
  return (
    <div className="py-4 lg:py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl flex items-center justify-center gap-3">
          <Crown className="h-8 w-8 text-lime" /> {t('daily.title')}
        </h1>
        <p className="mt-3 text-zinc-400">{t('daily.description')}</p>
      </div>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-b from-lime/[0.05] to-transparent shadow-glow-lg">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <Play className="h-16 w-16 text-lime/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <span className="absolute top-4 right-4 rounded-full bg-violet-500/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow-sm">
            {t('daily.demo')}
          </span>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block rounded-md bg-lime px-2 py-1 text-xs font-black uppercase text-ink mb-2">{t('daily.winner')}</span>
            <h2 className="text-2xl font-bold text-white">{t('daily.demo_title')}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t('daily.voice_by')}: EfsaneKral</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-sm leading-6 text-zinc-300">
            {t('daily.quote')}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button onClick={() => setActiveTab('scenes')} className="rounded-xl bg-lime px-6 py-3 text-sm font-bold text-ink hover:bg-[#d5ff78] transition shadow-glow">
              {t('daily.watch')}
            </button>
            <button onClick={() => setActiveTab('play')} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition">
              {t('daily.create')}
            </button>
            <button onClick={() => setActiveTab('dubs')} className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-zinc-400 hover:text-white transition ml-auto">
              {t('daily.all')}
            </button>
          </div>
          <p className="mt-6 text-xs text-zinc-500 border-t border-white/10 pt-4">
            {t('daily.notice')}
          </p>
        </div>
      </div>
    </div>
  )
}
