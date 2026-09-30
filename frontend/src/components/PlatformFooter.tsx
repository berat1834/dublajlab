import type { Tab } from '../types'
import { useLanguage } from '../LanguageContext'

interface PlatformFooterProps {
  setActiveTab: (tab: Tab) => void
  handleLegalLink: () => void
  setShowHowTo: (show: boolean) => void
}

export function PlatformFooter({ setActiveTab, handleLegalLink, setShowHowTo }: PlatformFooterProps) {
  const { t } = useLanguage()

  const handleNav = (tab: Tab) => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
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
              <a href="https://twitter.com/dublajlab" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">X</a>
              <a href="https://instagram.com/dublajlab" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">IG</a>
              <a href="https://discord.gg/dublajlab" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">DC</a>
              <a href="https://linkedin.com/company/dublajlab" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">IN</a>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.play')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => handleNav('oda_kur')} className="hover:text-white">Oda kur</button></li>
              <li><button onClick={() => handleNav('scenes')} className="hover:text-white">{t('footer.links.scenes')}</button></li>
              <li><button onClick={() => setShowHowTo(true)} className="hover:text-white">{t('footer.links.howto')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.dubs')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={() => handleNav('dubs')} className="hover:text-white">{t('nav.dubs')}</button></li>
              <li><button onClick={() => handleNav('daily')} className="hover:text-white">{t('nav.daily')}</button></li>
              <li><button onClick={() => handleNav('scenes')} className="hover:text-white">{t('nav.scenes')}</button></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Kurumsal</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><a href="mailto:info@dublajlab.com" className="hover:text-white">Hakkımızda</a></li>
              <li><a href="mailto:iletisim@dublajlab.com" className="hover:text-white">İletişim</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{t('footer.links.legal')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li><button onClick={handleLegalLink} className="hover:text-white">{t('footer.links.privacy')}</button></li>
              <li><button onClick={handleLegalLink} className="hover:text-white">{t('footer.links.terms')}</button></li>
              <li><button onClick={handleLegalLink} className="hover:text-white">{t('footer.links.copyright')}</button></li>
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
