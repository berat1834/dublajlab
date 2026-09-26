import { Diamond, Check, ArrowRight, Zap, PlaySquare, EyeOff, Mic2, Star, Users } from 'lucide-react'
import type { Tab } from '../types'

interface MembershipProps {
  setActiveTab: (tab: Tab) => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

export function Membership({ setActiveTab, onToast }: MembershipProps) {
  const vipFeatures = [
    { name: 'Hızlı render', description: 'İşlem kuyruğunda sıranın önüne geçersin.', icon: Zap },
    { name: '1080p çıktı', description: 'Kaynak izin verdiği ölçüde en yüksek kalite.', icon: EyeOff },
    { name: 'Filigransız', description: 'Finalde DublajLab logosu basılmaz.', icon: Diamond },
    { name: 'Voice FX', description: 'On beş profesyonel ses efekti.', icon: Mic2 },
    { name: 'VIP sahneler', description: 'Yalnızca üyelere açık sahneler.', icon: PlaySquare },
    { name: 'VIP rozeti', description: 'İsminin yanında görünür.', icon: Star },
    { name: 'Oda geneli haklar', description: 'Kurduğun odadaki herkes aynı çıktıyı alır.', icon: Users },
  ]

  return (
    <div className="py-8 max-w-4xl mx-auto pb-24 px-4 sm:px-0">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-white tracking-tight">Üyelik</h1>
        <p className="text-zinc-400 mt-2">Deney statünüz, haklarınız ve ödeme geçmişiniz.</p>
      </div>

      <div className="space-y-6">
        {/* Current Status */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-2">Deney Statüsü</h3>
              <div className="text-2xl font-bold text-white mb-2">Standart Erişim</div>
              <p className="text-sm text-zinc-400 max-w-xl">
                Ücretsiz sürümde tek başına, krediyle oynarsın. VIP ile arkadaşlarınla oda kurar ve sınırsız oynarsın; renderın öne alınır, 1080p ve filigransız çıktı alırsın.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => onToast('VIP satın alma altyapısı yakında!', 'error')} className="px-5 py-2.5 rounded-xl bg-amber-500 text-black text-sm font-bold hover:bg-amber-400 transition flex items-center gap-2">
                <Diamond className="h-4 w-4" /> VIP Ol
              </button>
              <button onClick={() => {
                document.getElementById('compare-table')?.scrollIntoView({ behavior: 'smooth' })
              }} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition">
                Paketleri Karşılaştır
              </button>
            </div>
          </div>
        </div>

        {/* Credits */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Krediler</h3>
            <div className="text-3xl font-black text-white flex items-center gap-2">
              35 <span className="text-sm font-medium text-zinc-400">Kullanılabilir</span>
            </div>
          </div>
          <button onClick={() => setActiveTab('user_credits')} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition">
            Kredi geçmişi
          </button>
        </div>

        {/* Features Table */}
        <div id="compare-table" className="rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden scroll-mt-24">
          <div className="px-6 py-5 border-b border-white/10 bg-black/20">
            <h3 className="text-lg font-bold text-white">Laboratuvar Hakları</h3>
            <p className="text-sm text-zinc-500 mt-1">Üyelikle açılan haklar. VIP+ bütün VIP haklarını kapsar.</p>
          </div>
          
          <div className="divide-y divide-white/5">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-black uppercase tracking-widest text-zinc-500 bg-white/[0.02]">
              <div className="col-span-8">Özellik</div>
              <div className="col-span-2 text-center text-amber-500">VIP</div>
              <div className="col-span-2 text-center text-amber-500">VIP+</div>
            </div>

            {vipFeatures.map((feature, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition">
                <div className="col-span-8 flex gap-3">
                  <div className="mt-1">
                    <feature.icon className="h-5 w-5 text-lime-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{feature.name}</div>
                    <div className="text-xs text-zinc-500">{feature.description}</div>
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div className="col-span-2 flex justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Promo Footer */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden mt-12">
          <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 blur-3xl rounded-full pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">
              DublajLab VIP
            </div>
            <h2 className="text-2xl font-black text-white">Dublaj daha hızlı, daha yüksek kalitede.</h2>
            <p className="text-sm text-zinc-400 mt-2">VIP üyelik ile sahneleri açar, render sırasını atlar ve 1080p çıktı alırsın.</p>
          </div>
          <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-black text-sm font-bold hover:brightness-110 transition shrink-0 relative z-10 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            VIP Ol <ArrowRight className="inline h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
