import { X } from 'lucide-react'
import type { Tab } from '../types'
import { useLanguage } from '../LanguageContext'

interface HowToModalProps {
  setShowHowTo: (show: boolean) => void
  setActiveTab: (tab: Tab) => void
}

export function HowToModal({ setShowHowTo, setActiveTab }: HowToModalProps) {
  const { t } = useLanguage()
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-panel shadow-2xl p-6 sm:p-8">
        <button onClick={() => setShowHowTo(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-black text-white">{t('howto.title')}</h2>
        <p className="mt-2 text-zinc-400">{t('howto.description')}</p>
        
        <div className="mt-8 space-y-6">
          <div className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet/20 text-lg font-black text-violet">1</div>
            <div>
              <h3 className="font-bold text-zinc-200">{t('howto.step1')}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t('howto.step1_desc')}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/20 text-lg font-black text-lime">2</div>
            <div>
              <h3 className="font-bold text-zinc-200">{t('howto.step2')}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t('howto.step2_desc')}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-lg font-black text-emerald-400">3</div>
            <div>
              <h3 className="font-bold text-zinc-200">{t('howto.step3')}</h3>
              <p className="mt-1 text-sm text-zinc-500">{t('howto.step3_desc')}</p>
            </div>
          </div>
        </div>
        
        <button onClick={() => { setShowHowTo(false); setActiveTab('play'); }} className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-zinc-200">
          {t('howto.start')}
        </button>
      </div>
    </div>
  )
}
