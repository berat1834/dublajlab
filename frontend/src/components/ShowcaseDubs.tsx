import { Play, CheckCircle2, MessageSquare } from 'lucide-react'

export function ShowcaseDubs() {
  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Dublajlar</h1>
        <p className="mt-3 text-zinc-400">Topluluğun kaydettiği efsane dublajları keşfet.</p>
        <div className="mt-3 inline-block rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-200/80">
          ⚠️ Bu alan canlı demo için örnek (placeholder) içeriklerle gösterilmektedir.
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-card transition hover:border-white/20">
            <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center">
              <Play className="h-10 w-10 text-white/40 group-hover:text-lime transition" />
              <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Komedi</span>
              <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-white">0:15</span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-white line-clamp-1">Demo Dublaj #{i}</h3>
              <p className="mt-1 text-xs text-zinc-500">Oyuncu{i}99</p>
              <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-zinc-400">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {i * 120}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {i * 12}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
