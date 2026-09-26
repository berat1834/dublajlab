import { ArrowRight, Coins, Calendar, TrendingUp } from 'lucide-react'
import type { Tab } from '../types'

interface UserCreditsProps {
  setActiveTab: (tab: Tab) => void
}

export function UserCredits({ setActiveTab }: UserCreditsProps) {
  return (
    <div className="py-8 max-w-4xl mx-auto pb-24 px-4 sm:px-0">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-white tracking-tight">Kredilerim</h1>
        <p className="text-zinc-400 mt-2">
          Ücretsiz sürümde oyunlar kredi ile oynanır, her sahne için ücret düşülür. VIP ve VIP+ üyeler sınırsız oynar.
        </p>
      </div>

      <div className="space-y-6">
        {/* Main Credit Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Kullanılabilir</div>
              <div className="text-5xl font-black text-white">35</div>
            </div>
            <button className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition">
              Kredi Al
            </button>
          </div>
          
          <div className="grid grid-cols-4 divide-x divide-white/10 border-t border-white/10 pt-6">
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-1">35</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ücretsiz</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-1">0</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Kalıcı</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-1">0</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Oyunda Tutulan</div>
            </div>
            <div className="text-center px-4">
              <div className="text-sm font-bold text-white mb-1">27 Eylül 00:00</div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-tight">Sonraki Yenilenme</div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 text-sm text-zinc-400 leading-relaxed">
          <div className="font-bold text-white mb-1 flex items-center gap-2">
            <Coins className="h-4 w-4 text-lime-400" />
            Her sahne: 10 kredi / oyuncu
          </div>
          <p className="mb-2">Ücretsiz kredin her gün 35 krediye tamamlanır. Bu yaklaşık 3 sahne eder.</p>
          <p className="text-zinc-500">Kalıcı krediler günlük yenilemede silinmez; önce ücretsiz krediler harcanır.</p>
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Hareketler</h3>
            <div className="flex items-center gap-2 p-1 rounded-lg bg-black border border-white/10">
              <button className="px-3 py-1 rounded-md bg-white/10 text-white text-xs font-bold">Tümü</button>
              <button className="px-3 py-1 rounded-md text-zinc-500 hover:text-white text-xs font-bold transition">Kazanılan</button>
              <button className="px-3 py-1 rounded-md text-zinc-500 hover:text-white text-xs font-bold transition">Harcanan</button>
            </div>
          </div>
          
          <div className="px-6 py-3 text-xs text-zinc-500 font-medium border-b border-white/5 bg-white/[0.02]">
            Yönetici işlemleri kendi adıyla görünür, gerekçe varsa altında yazar.
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
              <div>
                <div className="font-bold text-white text-sm mb-1">Hoş geldin kredisi</div>
                <div className="text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> 26 Eylül 17:00
                </div>
              </div>
              <div className="text-right">
                <div className="text-lime-400 font-black flex items-center justify-end gap-1 mb-1">
                  <TrendingUp className="h-3 w-3" /> +35
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Bakiye 35</div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Footer */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent p-8 flex flex-col md:flex-row items-center justify-between gap-6 mt-12">
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
    </div>
  )
}
