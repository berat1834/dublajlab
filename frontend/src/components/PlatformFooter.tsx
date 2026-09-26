import type { Tab } from '../types'

interface PlatformFooterProps {
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
  handleLegalLink: () => void
  setShowHowTo: (show: boolean) => void
}

export function PlatformFooter({ setActiveTab, handleFeatureSoon, handleLegalLink, setShowHowTo }: PlatformFooterProps) {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-2xl font-black tracking-tight">
              Dublaj<span className="text-lime">Lab</span>
            </a>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Bu proje bir kişisel portföy çalışması olup, video işleme (FFmpeg) ve asenkron web teknolojilerinin sunumunu hedefler. <br/>Tüm işlemler "demo" modundadır.
            </p>
            <div className="mt-6 flex items-center gap-4 text-zinc-400">
              <button onClick={handleFeatureSoon} className="hover:text-white transition">X</button>
              <button onClick={handleFeatureSoon} className="hover:text-white transition">IG</button>
              <button onClick={handleFeatureSoon} className="hover:text-white transition">DC</button>
              <button onClick={handleFeatureSoon} className="hover:text-white transition">IN</button>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Oyna</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={handleFeatureSoon} className="hover:text-white">Oda kur</button></li>
              <li><button onClick={() => setActiveTab('scenes')} className="hover:text-white">Sahneler</button></li>
              <li><button onClick={() => setShowHowTo(true)} className="hover:text-white">Nasıl oynanır</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Keşfet</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => setActiveTab('dubs')} className="hover:text-white">Dublajlar</button></li>
              <li><button onClick={() => setActiveTab('daily')} className="hover:text-white">Günün Dublajı</button></li>
              <li><button onClick={() => setActiveTab('scenes')} className="hover:text-white">Katalog</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Kurumsal</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={handleFeatureSoon} className="hover:text-white">Hakkımızda</button></li>
              <li><button onClick={handleFeatureSoon} className="hover:text-white">İletişim</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Yasal</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={handleLegalLink} className="hover:text-white">Gizlilik</button></li>
              <li><button onClick={handleLegalLink} className="hover:text-white">Kullanım koşulları</button></li>
              <li><button onClick={handleLegalLink} className="hover:text-white">Telif bildirimi</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © 2026 DublajLab
          </p>
          <p className="text-[10px] text-zinc-500 text-center sm:text-right max-w-xl">
            DublajLab kullanıcıların gönderdiği içeriklerde gerekli kullanım haklarına sahip olduklarını beyan etmelerini zorunlu tutar. Hak sahibinden geçerli bir ihlal bildirimi alınırsa içerik incelenir ve gerekirse erişimden kaldırılır.
          </p>
        </div>
      </div>
    </footer>
  )
}
