import { useState } from 'react'
import { Globe, MessageSquare, Crown, Menu, X, User as UserIcon, LogOut, Diamond } from 'lucide-react'
import type { Tab, User } from '../types'

interface PlatformNavbarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  currentUser?: User | null
  setCurrentUser?: (user: User | null) => void
}

export function PlatformNavbar({ activeTab, setActiveTab, handleFeatureSoon, mobileMenuOpen, setMobileMenuOpen, currentUser, setCurrentUser }: PlatformNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    if (setCurrentUser) setCurrentUser(null)
    setActiveTab('play')
    setDropdownOpen(false)
  }

  const handleDropdownNav = (tab: Tab) => {
    setActiveTab(tab)
    setDropdownOpen(false)
  }

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
            {currentUser ? (
              <div className="flex items-center gap-4 relative">
                {currentUser.role === 'admin' && (
                  <button onClick={() => setActiveTab('admin')} className={`rounded-lg px-3 py-1.5 transition text-sm font-bold ${activeTab === 'admin' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                    Admin
                  </button>
                )}
                <button onClick={() => setActiveTab('library')} className={`rounded-lg px-3 py-1.5 transition text-sm font-bold ${activeTab === 'library' ? 'bg-lime-400 text-black' : 'text-white hover:bg-white/10'}`}>
                  Kataloğum
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    className="flex items-center gap-2 hover:bg-white/5 p-1.5 rounded-lg transition"
                  >
                    <span className="text-sm font-bold text-white">{currentUser.display_name}</span>
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-lime-400/20 text-lime-400">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden py-2 z-50">
                      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-lime-400/20 text-lime-400 shrink-0">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-white">{currentUser.display_name}</div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Kayıtlı Hesap</div>
                        </div>
                      </div>
                      
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
                          <span>Seviye 1</span>
                          <span>0 / 100 XP</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-white w-[10%]"></div>
                        </div>
                      </div>

                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Diamond className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-black text-white">VIP ol</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">VIP sahneler, hızlı render ve 1080p çıktı.</p>
                      </div>

                      <div className="py-2">
                        <div className="px-4 py-1.5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">Hesabın</div>
                        <button onClick={() => handleDropdownNav('profile')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Profilim</button>
                        <button onClick={() => handleDropdownNav('membership')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Üyeliğim</button>
                        <button onClick={() => handleDropdownNav('library')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Kataloğum</button>
                        <button onClick={handleFeatureSoon} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Sahnelerim</button>
                        <button onClick={handleFeatureSoon} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Favorilerim</button>
                        <button onClick={() => handleDropdownNav('membership')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Kredilerim</button>
                        <button onClick={() => handleDropdownNav('profile')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">Hesabım</button>
                      </div>

                      <div className="border-t border-white/10 pt-2">
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center justify-between">
                          Çıkış yap <LogOut className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => setActiveTab('login')} className="text-zinc-300 hover:text-white">Giriş yap</button>
                <button onClick={() => setActiveTab('register')} className="rounded-lg bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">Kayıt ol</button>
              </>
            )}
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
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} className="text-left text-violet-400 font-bold">Admin Paneli</button>
                )}
                <button onClick={() => { setActiveTab('library'); setMobileMenuOpen(false); }} className="text-left text-lime-400 font-bold">Kataloğum</button>
                <div className="flex items-center gap-2 py-2 text-white">
                  <UserIcon className="h-4 w-4 text-lime-400" /> {currentUser.display_name}
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-left text-zinc-400">Çıkış yap</button>
              </>
            ) : (
              <>
                <button onClick={() => { setActiveTab('login'); setMobileMenuOpen(false); }} className="text-left">Giriş yap</button>
                <button onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }} className="text-left">Kayıt ol</button>
              </>
            )}
            <button onClick={handleFeatureSoon} className="text-left text-lime flex items-center gap-2"><Crown className="h-4 w-4" /> VIP ol</button>
          </div>
        </div>
      )}
    </>
  )
}
