import { Globe, MessageSquare, Crown, Menu, X } from 'lucide-react'
import type { Tab } from '../types'

interface PlatformNavbarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export function PlatformNavbar({ activeTab, setActiveTab, handleFeatureSoon, mobileMenuOpen, setMobileMenuOpen }: PlatformNavbarProps) {
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 glass-panel">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 lg:gap-10">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-xl font-black tracking-tight">
              Dublaj<span className="text-lime">Lab</span>
            </a>
            <div className="hidden items-center gap-2 md:flex text-sm font-semibold text-zinc-400">
              <button onClick={() => setActiveTab('play')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'play' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Oyna</button>
              <button onClick={() => setActiveTab('scenes')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'scenes' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Sahneler</button>
              <button onClick={() => setActiveTab('dubs')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'dubs' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Dublajlar</button>
              <button onClick={() => setActiveTab('daily')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'daily' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Günün Dublajı</button>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex text-sm font-medium">
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 text-zinc-400 hover:text-white">
              <Globe className="h-4 w-4" /> TR
            </button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 text-zinc-400 hover:text-white">
              <MessageSquare className="h-4 w-4" /> Discord
            </button>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <button onClick={() => setActiveTab('login')} className="text-zinc-300 hover:text-white">Giriş yap</button>
            <button onClick={() => setActiveTab('register')} className="rounded-lg bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 rounded-lg border border-lime/30 bg-lime/10 px-3 py-1.5 font-bold text-lime transition hover:bg-lime/20">
              <Crown className="h-4 w-4" /> VIP ol
            </button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-black/95 px-4 py-4 md:hidden text-sm font-medium">
          <div className="flex flex-col gap-4 text-zinc-300">
            <button onClick={() => { setActiveTab('play'); setMobileMenuOpen(false); }} className="text-left">Oyna</button>
            <button onClick={() => { setActiveTab('scenes'); setMobileMenuOpen(false); }} className="text-left">Sahneler</button>
            <button onClick={() => { setActiveTab('dubs'); setMobileMenuOpen(false); }} className="text-left">Dublajlar</button>
            <button onClick={() => { setActiveTab('daily'); setMobileMenuOpen(false); }} className="text-left">Günün Dublajı</button>
            <hr className="border-white/10" />
            <button onClick={handleFeatureSoon} className="text-left flex items-center gap-2"><Globe className="h-4 w-4" /> TR</button>
            <button onClick={handleFeatureSoon} className="text-left flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Discord</button>
            <button onClick={() => { setActiveTab('login'); setMobileMenuOpen(false); }} className="text-left">Giriş yap</button>
            <button onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }} className="text-left">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="text-left text-lime flex items-center gap-2"><Crown className="h-4 w-4" /> VIP ol</button>
          </div>
        </div>
      )}
    </>
  )
}
