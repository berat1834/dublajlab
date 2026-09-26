import { ArrowRight, Heart } from 'lucide-react'
import type { Tab } from '../types'

interface UserFavoritesProps {
  setActiveTab: (tab: Tab) => void
}

export function UserFavorites({ setActiveTab }: UserFavoritesProps) {
  return (
    <div className="py-8 max-w-4xl mx-auto pb-24 px-4 sm:px-0">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-white tracking-tight">Favorilerim</h1>
        <p className="text-zinc-400 mt-2">Sonra oynamak için işaretlediğin sahneler.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] py-24 px-4 flex flex-col items-center text-center mb-12">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <Heart className="h-8 w-8 text-zinc-600" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Henüz favorin yok.</h3>
        <p className="text-sm text-zinc-500 max-w-sm mb-8">
          Beğendiğin sahneyi kapağındaki kalple işaretle, burada birikir.
        </p>
        <button onClick={() => setActiveTab('scenes')} className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition">
          Sahne Keşfet
        </button>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">
            DublajLab VIP
          </div>
          <h2 className="text-2xl font-black text-white">Dublaj daha hızlı, daha yüksek kalitede.</h2>
          <p className="text-sm text-zinc-400 mt-2">VIP üyelik ile sahneleri açar, render sırasını atlar ve 1080p çıktı alırsın.</p>
        </div>
        <button onClick={() => setActiveTab('membership')} className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition shrink-0">
          VIP Ol <ArrowRight className="inline h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  )
}
