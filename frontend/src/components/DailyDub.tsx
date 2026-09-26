import { Crown, Play } from 'lucide-react'
import type { Tab } from '../types'

interface DailyDubProps {
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
}

export function DailyDub({ setActiveTab, handleFeatureSoon }: DailyDubProps) {
  return (
    <div className="py-4 lg:py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl flex items-center justify-center gap-3">
          <Crown className="h-8 w-8 text-lime" /> Günün Dublajı
        </h1>
        <p className="mt-3 text-zinc-400">Bugün en çok güldüren performans.</p>
      </div>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-b from-lime/[0.05] to-transparent shadow-glow-lg">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <Play className="h-16 w-16 text-lime/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block rounded-md bg-lime px-2 py-1 text-xs font-black uppercase text-ink mb-2">Günün Kazananı</span>
            <h2 className="text-2xl font-bold text-white">Toplantı faciası (Demo)</h2>
            <p className="mt-1 text-sm text-zinc-400">Seslendiren: EfsaneKral</p>
          </div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-sm leading-6 text-zinc-300">
            "Tüm gün süren o toplantı beş dakika sürecek dediler... Sonra herkes kahve molasına çıktı ama mikrofonum açık kalmış!"
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button onClick={handleFeatureSoon} className="rounded-xl bg-lime px-6 py-3 text-sm font-bold text-ink hover:bg-[#d5ff78] transition shadow-glow">
              Dublajı İzle
            </button>
            <button onClick={() => setActiveTab('play')} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition">
              Sen de Seslendir
            </button>
            <button onClick={() => setActiveTab('dubs')} className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-zinc-400 hover:text-white transition ml-auto">
              Tüm Dublajlar
            </button>
          </div>
          <p className="mt-6 text-xs text-zinc-500 border-t border-white/10 pt-4">
            * Yakında gerçek topluluk içerikleri eklenecektir. Bu sayfa tasarım demosudur.
          </p>
        </div>
      </div>
    </div>
  )
}
