import { useLanguage } from '../LanguageContext'
import { useEffect, useState } from 'react'
import { ShieldCheck, LoaderCircle, AlertTriangle } from 'lucide-react'

export function SecurityCheck({ onComplete }: { onComplete: () => void }) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase(1), 800)
    const timer2 = setTimeout(() => setPhase(2), 1600)
    const timer3 = setTimeout(() => setPhase(3), 2200)
    const timer4 = setTimeout(() => onComplete(), 2800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]">
      <div className="max-w-md w-full p-8 rounded-2xl border border-white/5 bg-[#0a0a0a] shadow-2xl shadow-black">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            {phase < 3 ? (
              <LoaderCircle className="h-12 w-12 text-lime-400 animate-spin" />
            ) : (
              <ShieldCheck className="h-12 w-12 text-lime-400 animate-pulse" />
            )}
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">
            {phase < 3 ? t('security.check') : t('security.safe')}
          </h2>
          
          <div className="h-6 text-sm font-medium text-zinc-500 mb-8">
            {phase === 0 && t('security.connecting')}
            {phase === 1 && t('security.verifying')}
            {phase === 2 && t('security.bot_check')}
            {phase === 3 && t('security.redirecting')}
          </div>

          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-lime-400 transition-all duration-300 ease-out"
              style={{ width: `${(phase / 3) * 100}%` }}
            ></div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-zinc-600 uppercase tracking-widest">
            <AlertTriangle className="h-3 w-3" />
            DublajLab Security
          </div>
        </div>
      </div>
    </div>
  )
}
