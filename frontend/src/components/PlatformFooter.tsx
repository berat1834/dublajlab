import type { Tab, User } from '../types'
import { useLanguage } from '../LanguageContext'

type LegalPageId = 'about' | 'contact' | 'privacy' | 'terms' | 'copyright' | 'refund' | 'distance_selling'

interface PlatformFooterProps {
  setActiveTab: (tab: Tab) => void
  handleLegalLink: (pageId: LegalPageId) => void
  setShowHowTo: (show: boolean) => void
  currentUser?: User | null
  onToast: (msg: string) => void
}

export function PlatformFooter({ setActiveTab, handleLegalLink, setShowHowTo, currentUser, onToast }: PlatformFooterProps) {
  const { t } = useLanguage()

  const handleNav = (tab: Tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleKatalogNav = () => {
    if (currentUser) {
      handleNav('library')
    } else {
      handleNav('login')
    }
  }

  const socialLinks = [
    { url: import.meta.env.VITE_SOCIAL_X_URL, label: 'X', ariaLabel: 'X' },
    { url: import.meta.env.VITE_SOCIAL_INSTAGRAM_URL, label: 'IG', ariaLabel: 'Instagram' },
    { url: import.meta.env.VITE_SOCIAL_DISCORD_URL, label: 'DC', ariaLabel: 'Discord' },
    { url: import.meta.env.VITE_SOCIAL_LINKEDIN_URL, label: 'IN', ariaLabel: 'LinkedIn' },
  ]

  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:py-16 3xl:max-w-[1600px] 4xl:max-w-[1800px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <a href="#" onClick={(e) => { e.preventDefault(); handleNav('play'); }} className="inline-block" aria-label="DublajLab ana sayfa">
              <img src="/assets/dublajlab-logo.svg" alt="DublajLab" className="h-10 w-auto max-w-[190px]" />
            </a>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {t('footer.desc')}
            </p>
            <div className="mt-6 flex items-center gap-4 text-zinc-400">
              {socialLinks.map((social, index) => (
                social.url ? (
                  <a key={index} href={social.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label={social.ariaLabel}>
                    {social.label}
                  </a>
                ) : (
                  <button 
                    key={index} 
                    onClick={() => onToast(t('toast.social_soon'))} 
                    className="opacity-50 cursor-not-allowed hover:opacity-100 transition"
                    title={t('social.soon')}
                    aria-label={`${social.ariaLabel} (${t('social.soon')})`}
                  >
                    {social.label}
                  </button>
                )
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.play')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => handleNav('scenes')} className="hover:text-white">{t('footer.links.scenes')}</button></li>
              <li><button onClick={() => setShowHowTo(true)} className="hover:text-white">{t('footer.links.howto')}</button></li>
              <li><button onClick={() => onToast(t('toast.suggest_soon'))} className="hover:text-white">{t('footer.links.suggest')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.dubs')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => handleNav('dubs')} className="hover:text-white">{t('nav.dubs')}</button></li>
              <li><button onClick={() => handleNav('daily')} className="hover:text-white">{t('nav.daily')}</button></li>
              <li><button onClick={handleKatalogNav} className="hover:text-white">{t('drop.library')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.corporate')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => handleLegalLink('about')} className="hover:text-white">{t('footer.links.about')}</button></li>
              <li><button onClick={() => handleLegalLink('contact')} className="hover:text-white">{t('footer.links.contact')}</button></li>
              <li><button onClick={() => handleNav('membership')} className="hover:text-white">{t('drop.membership')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.legal')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => handleLegalLink('privacy')} className="hover:text-white">{t('footer.links.privacy')}</button></li>
              <li><button onClick={() => handleLegalLink('terms')} className="hover:text-white">{t('footer.links.terms')}</button></li>
              <li><button onClick={() => handleLegalLink('copyright')} className="hover:text-white">{t('footer.links.copyright')}</button></li>
              <li><button onClick={() => handleLegalLink('refund')} className="hover:text-white">{t('footer.links.refund')}</button></li>
              <li><button onClick={() => handleLegalLink('distance_selling')} className="hover:text-white">{t('footer.links.distance')}</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © 2026 DublajLab
          </p>
          <p className="text-[10px] text-zinc-500 text-center sm:text-right max-w-xl">
            {t('footer.disclaimer')}
          </p>
        </div>
      </div>
    </footer>
  )
}
