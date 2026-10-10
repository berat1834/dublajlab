import { useState, useRef, useEffect } from 'react'
import { Globe, MessageSquare, Crown, Menu, X, User as UserIcon, LogOut, Diamond } from 'lucide-react'
import type { Tab, User } from '../types'
import { useLanguage } from '../LanguageContext'

interface PlatformNavbarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  currentUser?: User | null
  setCurrentUser?: (user: User | null) => void
  onToast?: (msg: string) => void
}

export function PlatformNavbar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen, currentUser, setCurrentUser, onToast }: PlatformNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDropdownOpen(false)
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [dropdownOpen])

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
      <nav className="sticky top-0 z-50 border-b border-white/10 glass-panel" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-3 sm:h-16 sm:px-6 3xl:max-w-[1600px] 4xl:max-w-[1800px]">
          <div className="flex items-center gap-6 lg:gap-10">
            <button onClick={() => setActiveTab('play')} className="block shrink-0" aria-label="DublajLab ana sayfa">
              <img src="/assets/dublajlab-logo.svg" alt="DublajLab" className="h-8 w-auto max-w-[150px] sm:h-9 sm:max-w-[170px]" />
            </button>
            <div className="hidden items-center gap-2 md:flex text-sm font-semibold text-zinc-400">
              <button onClick={() => setActiveTab('play')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'play' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>{t('nav.play')}</button>
              <button onClick={() => setActiveTab('scenes')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'scenes' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>{t('nav.scenes')}</button>
              <button onClick={() => setActiveTab('dubs')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'dubs' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>{t('nav.dubs')}</button>
              <button onClick={() => setActiveTab('daily')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'daily' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>{t('nav.daily')}</button>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex text-sm font-medium">
            <button onClick={() => setLanguage(language === 'TR' ? 'EN' : 'TR')} className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition w-[50px] justify-center">
              <Globe className="h-4 w-4" /> {language}
            </button>
            <button onClick={() => {
              const discordUrl = import.meta.env.VITE_SOCIAL_DISCORD_URL;
              if (discordUrl) {
                window.open(discordUrl, '_blank', 'noopener,noreferrer')
              } else if (onToast) {
                onToast(t('toast.social_soon'))
              }
            }} className={`flex items-center gap-1.5 transition ${import.meta.env.VITE_SOCIAL_DISCORD_URL ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 cursor-not-allowed'}`} title={!import.meta.env.VITE_SOCIAL_DISCORD_URL ? t('social.soon') : undefined}>
              <MessageSquare className="h-4 w-4" /> Discord
            </button>
            <div className="h-4 w-[1px] bg-white/10"></div>
            {currentUser ? (
              <div className="flex items-center gap-4 relative">
                {currentUser.role === 'admin' && (
                  <>
                    <button onClick={() => setActiveTab('admin')} className={`rounded-lg px-3 py-1.5 transition text-sm font-bold ${activeTab === 'admin' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                      {t('nav.moderation')}
                    </button>
                    <button onClick={() => setActiveTab('admin_ops')} className={`rounded-lg px-3 py-1.5 transition text-sm font-bold ${activeTab === 'admin_ops' ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}>
                      {t('nav.system')}
                    </button>
                  </>
                )}
                <button onClick={() => setActiveTab('library')} className={`rounded-lg px-3 py-1.5 transition text-sm font-bold ${activeTab === 'library' ? 'bg-lime-400 text-black' : 'text-white hover:bg-white/10'}`}>
                  {t('drop.library')}
                </button>
                
                <div className="relative" ref={dropdownRef}>
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
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{t('nav.account_registered')}</div>
                        </div>
                      </div>
                      
                      <div className="px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Diamond className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-black text-white">{currentUser.has_active_vip ? t('nav.vip_active') : t('nav.vip_join')}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500">{currentUser.has_active_vip ? t('nav.vip_active_desc') : t('nav.vip_join_desc')}</p>
                      </div>

                      <div className="py-2">
                        <div className="px-4 py-1.5 text-[10px] font-black text-zinc-600 uppercase tracking-widest">{t('nav.account_section')}</div>
                        <button onClick={() => handleDropdownNav('profile')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">{t('drop.profile')}</button>
                        <button onClick={() => handleDropdownNav('membership')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">{t('drop.membership')}</button>
                        <button onClick={() => handleDropdownNav('library')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">{t('drop.library')}</button>
                        <button onClick={() => handleDropdownNav('account')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition">{t('drop.account')}</button>
                      </div>

                      <div className="border-t border-white/10 pt-2">
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition flex items-center justify-between">
                          {t('drop.logout')} <LogOut className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => setActiveTab('login')} className="text-zinc-300 hover:text-white">{t('nav.login')}</button>
                <button onClick={() => setActiveTab('register')} className="rounded-lg bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">{t('nav.register')}</button>
              </>
            )}
            <button onClick={() => setActiveTab('membership')} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-bold transition ${currentUser?.has_active_vip ? 'border-amber-300/30 bg-amber-300/10 text-amber-200 hover:bg-amber-300/15' : 'border-lime/30 bg-lime/10 text-lime hover:bg-lime/20'}`}>
              <Crown className="h-4 w-4" /> {currentUser?.has_active_vip ? t('nav.vip_active') : t('vip.button')}
            </button>
          </div>
          <button aria-label={mobileMenuOpen ? t("nav.close_menu") : t("nav.open_menu")} className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-black/95 px-4 py-4 md:hidden text-sm font-medium max-h-[80vh] overflow-y-auto" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
          <div className="flex flex-col gap-4 text-zinc-300">
            <button onClick={() => { setActiveTab('play'); setMobileMenuOpen(false); }} className="text-left">{t('nav.play')}</button>
            <button onClick={() => { setActiveTab('scenes'); setMobileMenuOpen(false); }} className="text-left">{t('nav.scenes')}</button>
            <button onClick={() => { setActiveTab('dubs'); setMobileMenuOpen(false); }} className="text-left">{t('nav.dubs')}</button>
            <button onClick={() => { setActiveTab('daily'); setMobileMenuOpen(false); }} className="text-left">{t('nav.daily')}</button>
            <hr className="border-white/10" />
            <button onClick={() => setLanguage(language === 'TR' ? 'EN' : 'TR')} className="text-left flex items-center gap-2 py-3"><Globe className="h-4 w-4" /> {language}</button>
            <button onClick={() => {
              const discordUrl = import.meta.env.VITE_SOCIAL_DISCORD_URL;
              if (discordUrl) {
                window.open(discordUrl, '_blank', 'noopener,noreferrer')
              } else {
                if (onToast) onToast(t('toast.social_soon'))
                setMobileMenuOpen(false);
              }
            }} className={`text-left flex items-center gap-2 py-3 text-sm font-bold transition ${import.meta.env.VITE_SOCIAL_DISCORD_URL ? 'text-zinc-300 hover:text-white' : 'text-zinc-600 cursor-not-allowed'}`} title={!import.meta.env.VITE_SOCIAL_DISCORD_URL ? t('social.soon') : undefined}><MessageSquare className="h-4 w-4" /> Discord</button>
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <>
                    <button onClick={() => { setActiveTab('admin'); setMobileMenuOpen(false); }} className="text-left text-violet-400 font-bold">{t('nav.moderation_panel')}</button>
                    <button onClick={() => { setActiveTab('admin_ops'); setMobileMenuOpen(false); }} className="text-left text-violet-400 font-bold">{t('nav.system_status')}</button>
                  </>
                )}
                <button onClick={() => { setActiveTab('library'); setMobileMenuOpen(false); }} className="text-left text-lime-400 font-bold">{t('drop.library')}</button>
                <div className="flex items-center gap-2 py-2 text-white">
                  <UserIcon className="h-4 w-4 text-lime-400" /> {currentUser.display_name}
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-left text-zinc-400">{t('drop.logout')}</button>
              </>
            ) : (
              <>
                <button onClick={() => { setActiveTab('login'); setMobileMenuOpen(false); }} className="text-left">{t('nav.login')}</button>
                <button onClick={() => { setActiveTab('register'); setMobileMenuOpen(false); }} className="text-left">{t('nav.register')}</button>
              </>
            )}
            <button onClick={() => { setActiveTab('membership'); setMobileMenuOpen(false); }} className="text-left text-lime flex items-center gap-2 py-3 text-sm font-bold transition"><Crown className="h-4 w-4" /> {currentUser?.has_active_vip ? t('nav.vip_active') : t('vip.button')}</button>
          </div>
        </div>
      )}
    </>
  )
}
