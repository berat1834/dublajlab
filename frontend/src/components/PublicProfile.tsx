import { ArrowRight, Settings } from 'lucide-react'
import type { User, Tab } from '../types'

interface PublicProfileProps {
  currentUser: User
  setActiveTab: (tab: Tab) => void
}

export function PublicProfile({ currentUser, setActiveTab }: PublicProfileProps) {
  return (
    <div className="py-8 max-w-4xl mx-auto pb-24 px-4 sm:px-0">
      
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 p-1">
            <div className="h-full w-full bg-[#0a0a0a] rounded-xl flex items-center justify-center overflow-hidden">
              {currentUser.avatar_url ? (
                <img src={currentUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="text-3xl font-black text-lime-400">
                  {currentUser.display_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{currentUser.display_name}</h1>
            <div className="text-sm font-bold text-zinc-400 mt-1">Acemi Dublajcı · Seviye 1</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-3">Eylül 2026 Katıldı</div>
          </div>
        </div>
        <button onClick={() => setActiveTab('account')} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition flex items-center gap-2">
          <Settings className="h-4 w-4" /> Profili Düzenle
        </button>
      </div>

      {/* Stats & Progress */}
      <div className="mb-12">
        <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
          <span>0 / 100 XP</span>
          <span>Seslendirme — seviye 3</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-8">
          <div className="h-full bg-lime-400 w-[10%]"></div>
        </div>

        <div className="flex flex-wrap items-center gap-6 border-b border-white/10 pb-4">
          <div className="text-sm font-bold text-zinc-400 hover:text-white cursor-pointer transition">
            <span className="text-white">0</span> Dublaj
          </div>
          <div className="text-sm font-bold text-zinc-400 hover:text-white cursor-pointer transition">
            <span className="text-white">0</span> Oyun
          </div>
          <div className="text-sm font-bold text-zinc-400 hover:text-white cursor-pointer transition">
            <span className="text-white">0</span> Replik
          </div>
          <div className="text-sm font-bold text-zinc-400 hover:text-white cursor-pointer transition">
            <span className="text-white">0</span> Tepki
          </div>
          <div className="text-sm font-bold text-zinc-400 hover:text-white cursor-pointer transition">
            <span className="text-white">0</span> Arkadaş
          </div>
        </div>
      </div>

      {/* Recent Dubs (Son Dublajlar) */}
      <div className="mb-12">
        <h3 className="text-sm font-bold text-white mb-4">Son dublajlar</h3>
        <div className="rounded-2xl border border-white/10 border-dashed bg-transparent py-16 px-4 flex flex-col items-center text-center">
          <p className="text-sm text-zinc-500 mb-2">Henüz dublaj yok.</p>
          <button onClick={() => setActiveTab('oda_kur')} className="text-sm font-bold text-white hover:text-lime-400 transition flex items-center gap-1">
            Bir oyun başlat <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* VIP Promo */}
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
