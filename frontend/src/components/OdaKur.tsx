import { useState } from 'react'
import { ArrowRight, Download, RefreshCw, SquarePlay } from 'lucide-react'
import type { Tab } from '../types'

interface OdaKurProps {
  setActiveTab: (tab: Tab) => void
}

export function OdaKur({ setActiveTab }: OdaKurProps) {
  const [playerCount, setPlayerCount] = useState(1)
  const [sceneMode, setSceneMode] = useState<'random' | 'manual'>('random')

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-wider">Odani Kur</h1>
          <p className="mt-2 text-sm text-zinc-400">Üç ayar, sonra kodu paylaş. Oda dolunca oyun başlar.</p>
        </div>
        <div className="flex gap-4">
          <button className="text-sm font-bold text-zinc-500 hover:text-white transition">Yeni Oda</button>
          <button onClick={() => setActiveTab('play')} className="text-sm font-bold text-zinc-500 hover:text-white transition">Vazgeç</button>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex items-center gap-2">
          <div className="grid h-5 w-5 place-items-center rounded-full bg-white text-black text-[10px] font-bold">✓</div>
          <span className="text-sm font-bold text-white">OYUNCU</span>
        </div>
        <div className="h-px w-16 bg-white/20 self-center"></div>
        <div className="flex items-center gap-2">
          <div className="grid h-5 w-5 place-items-center rounded-full bg-white text-black text-[10px] font-bold">✓</div>
          <span className="text-sm font-bold text-white">SAHNE</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-12">
        <div className="space-y-12">
          {/* Kaç kişisiniz */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-6 w-6 place-items-center bg-white text-black font-black text-sm">✓</div>
              <h2 className="text-xl font-bold text-white">Kaç kişisiniz?</h2>
            </div>
            
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border ${playerCount === num ? 'border-white bg-white/10' : 'border-white/10 bg-transparent hover:bg-white/5'} transition`}
                >
                  <span className={`text-2xl font-black ${playerCount === num ? 'text-white' : 'text-zinc-500'}`}>{num}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${playerCount === num ? 'text-white' : 'text-zinc-600'}`}>
                    {num === 1 ? 'Kişi (Solo)' : 'Kişi'}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-zinc-400">
              Tek başınıza oynarsınız: sahnedeki bütün karakterleri siz seslendirirsiniz. Sahneler sırayla gelir. Katalogunuz tamamiyle açık.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-xs font-bold text-amber-500/80 mb-1">Ücretsiz sürümde tek başına oynanır. Her sahne krediden düşer.</p>
              <p className="text-xs text-amber-500/60">Arkadaşlarınızla oda kurmak için VIP ol. VIP+ bir arkadaşınız odasına kredi harcamadan katılabilirsin.</p>
              <button className="mt-2 text-xs font-bold text-amber-500 hover:underline">VIP'e geç →</button>
            </div>
          </section>

          {/* Sahne nasıl seçilsin */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="grid h-6 w-6 place-items-center bg-white text-black font-black text-sm">✓</div>
              <h2 className="text-xl font-bold text-white">Sahne nasıl seçilsin?</h2>
            </div>

            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition mb-3">
              <div className="flex items-center gap-4">
                <Download className="h-5 w-5 text-zinc-400" />
                <div className="text-left">
                  <p className="text-sm font-bold text-white">Sahne aktar <span className="ml-2 text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black">VIP</span></p>
                  <p className="text-xs text-zinc-500">VIP ve VIP+ üyelere özel. Başkalarının sahnelerini odana getirmek için VIP ol.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-500">VIP'e geç →</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSceneMode('random')}
                className={`flex items-start gap-3 p-4 rounded-xl border ${sceneMode === 'random' ? 'border-white bg-white/10' : 'border-white/10 bg-transparent hover:bg-white/5'} transition text-left`}
              >
                <RefreshCw className={`h-5 w-5 mt-0.5 ${sceneMode === 'random' ? 'text-white' : 'text-zinc-500'}`} />
                <div>
                  <p className={`text-sm font-bold ${sceneMode === 'random' ? 'text-white' : 'text-zinc-400'}`}>Rastgele</p>
                  <p className="text-xs text-zinc-500 mt-1">Her turda sürpriz. Son oynadıklarınız tekrar gelmez.</p>
                </div>
              </button>

              <button
                onClick={() => setSceneMode('manual')}
                className={`flex items-start gap-3 p-4 rounded-xl border ${sceneMode === 'manual' ? 'border-white bg-white/10' : 'border-white/10 bg-transparent hover:bg-white/5'} transition text-left`}
              >
                <SquarePlay className={`h-5 w-5 mt-0.5 ${sceneMode === 'manual' ? 'text-white' : 'text-zinc-500'}`} />
                <div>
                  <p className={`text-sm font-bold ${sceneMode === 'manual' ? 'text-white' : 'text-zinc-400'}`}>Sahneyi ben seçeyim</p>
                  <p className="text-xs text-zinc-500 mt-1">Listeden bir sahne seç.</p>
                </div>
              </button>
            </div>
            
            <div className="mt-6 flex justify-between border-t border-white/10 pt-4 text-[10px] text-zinc-500">
              <span className="uppercase tracking-widest font-bold">KENDİ SAHNELERİN</span>
              <span className="font-bold cursor-pointer hover:text-white transition">Sahne yap →</span>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">
              Henüz oynanabilir bir sahnen yok. Kendi videonla sahne yap; hazır olunca onay beklemeden kendi odanda oynayabilirsin.
            </p>
          </section>
        </div>

        {/* ÖZET Panel */}
        <div>
          <div className="rounded-xl border border-white/10 bg-black p-6 sticky top-24 shadow-2xl">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">ÖZET</h3>
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <span className="text-xs text-zinc-500 font-bold">Oyuncu</span>
              <span className="text-sm font-black text-white">{playerCount} kişi</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4">
              <span className="text-xs text-zinc-500 font-bold">Sahne</span>
              <span className="text-sm font-black text-white">
                {sceneMode === 'random' ? 'Rastgele seçilecek' : 'Siz seçeceksiniz'}
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="text-xs text-zinc-500 font-bold block mb-1">KREDİT</span>
                <span className="text-sm font-black text-white block">10 kredi / oyuncu</span>
                <span className="text-[10px] text-zinc-600">Genel sahne ücreti</span>
              </div>
              <span className="text-[10px] font-bold text-zinc-600 self-start">Kredi lazım</span>
            </div>

            <p className="text-[10px] text-zinc-500 mb-6 text-center">Bakiye: 35 kredi</p>

            <button className="w-full rounded-xl bg-white text-black py-4 text-sm font-black hover:bg-zinc-200 transition">
              Odayı kur →
            </button>
            <p className="text-[10px] text-zinc-600 text-center mt-4 font-medium">Kurduktan sonra oda kodunu paylaşacaksın.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
