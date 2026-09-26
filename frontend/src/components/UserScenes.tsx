import { ArrowRight, Film, Users, Mic, AudioWaveform, Globe } from 'lucide-react'
import type { Tab } from '../types'

interface UserScenesProps {
  setActiveTab: (tab: Tab) => void
}

export function UserScenes({ setActiveTab }: UserScenesProps) {
  const steps = [
    { title: 'Video', desc: 'MP4 yükle, süre ve ses otomatik ölçülür.', icon: Film },
    { title: 'Karakterler', desc: 'Sahnede konuşan her kişiyi ekle.', icon: Users },
    { title: 'Replikler', desc: 'Kimin ne zaman konuştuğunu işaretle.', icon: Mic },
    { title: 'Arka plan sesi', desc: 'Vokal ayırıcıyla ayır ya da hazır dosyanı yükle.', icon: AudioWaveform },
    { title: 'Yayınla', desc: 'Kendi odanda oyna ya da herkese açılması için gönder.', icon: Globe },
  ]

  return (
    <div className="py-8 max-w-4xl mx-auto pb-24 px-4 sm:px-0">
      {/* Header */}
      <div className="mb-12 rounded-2xl border border-white/10 bg-[#0f0f0f] p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-500 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            Stüdyo
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Sahnelerim</h1>
          <p className="text-zinc-400 text-sm">
            Kendi sahneni kur, repliklerini ayarla, arka plan sesini hazırla ve incelemeye gönder. Onaylanan sahneler yayına girer ve adın "Ekleyen" olarak görünür.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-2xl font-black text-white">0<span className="text-sm font-bold text-zinc-500">/3</span></div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Açık Taslak</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">0</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">İncelenmede</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">0</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Yayında</div>
            </div>
          </div>
          <div className="w-[1px] h-12 bg-white/10 hidden sm:block"></div>
          <button className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition shadow-[0_0_15px_rgba(220,38,38,0.3)] shrink-0">
            Yeni Sahne
          </button>
        </div>
      </div>

      {/* Steps Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {steps.map((step, idx) => (
          <div key={idx} className="rounded-xl border border-white/5 bg-[#0a0a0a] p-4 flex flex-col items-start hover:border-white/10 transition">
            <div className="text-[10px] font-black text-zinc-600 mb-2">0{idx + 1}</div>
            <div className="font-bold text-white text-sm mb-1">{step.title}</div>
            <div className="text-xs text-zinc-500 leading-relaxed">{step.desc}</div>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-zinc-500 mb-8 font-medium">Gönderdiğin içeriğin haklarına sahip olmalısın. Ayrıntılar: <span className="underline cursor-pointer hover:text-white">Telif bildirimi</span></p>

      {/* Empty State */}
      <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] py-20 px-4 flex flex-col items-center text-center">
        <h3 className="text-xl font-black text-white mb-3">Henüz sahne göndermedin</h3>
        <p className="text-sm text-zinc-400 max-w-md mb-8">
          Bir film ya da dizi sahnesinin videosunu yükle, kimin ne zaman konuştuğunu işaretle, arka plan sesini hazırla ve incelemeye gönder.
        </p>
        <button className="px-6 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 transition">
          İlk Sahneni Oluştur
        </button>
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
  )
}
