import { Crown } from 'lucide-react'

interface VipPromoProps {
  onToast: (msg: string) => void
}

export function VipPromo({ onToast }: VipPromoProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 my-12 mx-auto max-w-5xl w-full">
      <div className="relative z-10 max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-500 mb-4">
          <Crown className="h-3 w-3" /> VIP Sürüm
        </span>
        <h2 className="text-2xl font-black text-white">Daha yüksek kalite export çok yakında.</h2>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Ücretsiz public demo'da 480p export sunulmaktadır. (Bu alan canlı ürünleşme için eklenmiş bir tasarım placeholder'ıdır.)
        </p>
      </div>
      <button onClick={() => onToast('VIP üyelik sistemi henüz aktif değil. (Demo)')} className="relative z-10 shrink-0 rounded-xl bg-amber-500 px-8 py-3.5 text-sm font-black text-black hover:bg-amber-400 transition shadow-[0_0_20px_rgba(245,158,11,0.3)]">
        VIP özelliklerini keşfet
      </button>
    </div>
  )
}
