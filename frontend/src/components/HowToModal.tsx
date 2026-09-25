import { X } from 'lucide-react'
import type { Tab } from '../types'

interface HowToModalProps {
  setShowHowTo: (show: boolean) => void
  setActiveTab: (tab: Tab) => void
}

export function HowToModal({ setShowHowTo, setActiveTab }: HowToModalProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-panel shadow-2xl p-6 sm:p-8">
        <button onClick={() => setShowHowTo(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-white">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-black text-white">Nasıl Oynanır?</h2>
        <p className="mt-2 text-zinc-400">DublajLab'de kendi sesinle eğlenceli videolar üretmek çok kolay.</p>
        
        <div className="mt-8 space-y-6">
          <div className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet/20 text-lg font-black text-violet">1</div>
            <div>
              <h3 className="font-bold text-zinc-200">Sahne Seç</h3>
              <p className="mt-1 text-sm text-zinc-500">Sahneler galerisinden bir video seç veya kendi cihazından video yükle.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/20 text-lg font-black text-lime">2</div>
            <div>
              <h3 className="font-bold text-zinc-200">Repliği Oku</h3>
              <p className="mt-1 text-sm text-zinc-500">Zaman çizelgesindeki replikleri takip et, sıran geldiğinde mikrofonla sesini kaydet.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-lg font-black text-emerald-400">3</div>
            <div>
              <h3 className="font-bold text-zinc-200">Videoyu İndir</h3>
              <p className="mt-1 text-sm text-zinc-500">Tüm replikleri kaydettikten sonra sistem otomatik olarak sesi miksler ve MP4 olarak sana sunar.</p>
            </div>
          </div>
        </div>
        
        <button onClick={() => { setShowHowTo(false); setActiveTab('play'); }} className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-zinc-200">
          Hemen Başla
        </button>
      </div>
    </div>
  )
}
