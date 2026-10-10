import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useLanguage } from '../LanguageContext'

type PageId = 'about' | 'contact' | 'privacy' | 'terms' | 'copyright' | 'refund' | 'distance_selling'

interface LegalCorporateModalProps {
  pageId: PageId
  onClose: () => void
}

export function LegalCorporateModal({ pageId, onClose }: LegalCorporateModalProps) {
  const { t } = useLanguage()
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose()
    }
  }

  const getContent = () => {
    switch (pageId) {
      case 'about':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.about.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>{t('legal.about.p1')}</p>
              <p>{t('legal.about.p2')}</p>
              <p>{t('legal.about.p3')}</p>
            </div>
          </>
        )
      case 'contact':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.contact.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>{t('legal.contact.p1')}</p>
              <p>{t('legal.contact.p2')}</p>
              <p className="font-mono text-[#B8FF4D]">destek@dublajlab.com.tr</p>
              <p className="text-xs text-zinc-500 mt-4">{t('legal.contact.p3')}</p>
            </div>
          </>
        )
      case 'privacy':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.privacy.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>{t('legal.privacy.p1')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('legal.privacy.li1')}</li>
                <li>{t('legal.privacy.li2')}</li>
                <li>{t('legal.privacy.li3')}</li>
              </ul>
            </div>
          </>
        )
      case 'terms':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.terms.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>{t('legal.terms.p1')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('legal.terms.li1')}</li>
                <li>{t('legal.terms.li2')}</li>
                <li>{t('legal.terms.li3')}</li>
              </ul>
            </div>
          </>
        )
      case 'copyright':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.copyright.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>{t('legal.copyright.p1')}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('legal.copyright.li1')}</li>
                <li>{t('legal.copyright.li2')}</li>
                <li>{t('legal.copyright.li3')}</li>
              </ul>
            </div>
          </>
        )
      case 'refund':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.refund.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p><strong>{t('legal.refund.p1')}</strong></p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t('legal.refund.li1')}</li>
                <li>{t('legal.refund.li2')}</li>
              </ul>
            </div>
          </>
        )
      case 'distance_selling':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">{t('legal.distance.title')}</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>{t('legal.distance.p1')}</p>
              <p>{t('legal.distance.p2')}</p>
              <p>{t('legal.distance.p3')}</p>
              <p><strong>{t('legal.distance.p4')}</strong></p>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#08090D] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
              <img src="/assets/dublajlab-mark.svg" alt="Mark" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-white">{t('legal.title')}</h3>
              <p className="text-xs text-zinc-400">{t('legal.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {getContent()}
        </div>

        <div className="border-t border-white/10 bg-black/20 p-6">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-white/5 py-3 text-sm font-medium text-white transition hover:bg-white/10 active:scale-95"
          >
            {t('legal.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
