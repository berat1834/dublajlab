import { useState } from 'react'
import { Check, Crown, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import { getMe } from '../lib/api'
import type { Tab, User } from '../types'
import { useLanguage } from '../LanguageContext'

interface MembershipProps {
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  setActiveTab: (tab: Tab) => void
  onToast: (message: string) => void
}

export function Membership({ currentUser, setCurrentUser, setActiveTab, onToast }: MembershipProps) {
  const { t } = useLanguage()
  const [refreshing, setRefreshing] = useState(false)
  const isVip = Boolean(currentUser?.has_active_vip)
  const vipPrice = (import.meta.env.VITE_VIP_PRICE_LABEL || '₺199').trim()
  const included = t('membership.included')
  const locked = t('membership.locked')
  const features = [
    { name: t('membership.feature.mic'), free: included, vip: included },
    { name: t('membership.feature.upload'), free: included, vip: included },
    { name: t('membership.feature.quality'), free: '720p', vip: '1080p' },
    { name: t('membership.feature.ai'), free: locked, vip: included },
    { name: t('membership.feature.badge'), free: '—', vip: included },
  ]

  const startCheckout = async () => {
    if (!currentUser) {
      onToast(t('membership.login_first'))
      setActiveTab('login')
      return
    }
    if (!(import.meta.env.VITE_SHOPIER_VIP_URL || '').trim()) {
      onToast(t('membership.payment_unavailable'))
      return
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/payments/checkout?plan=monthly`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 503) {
          onToast(t('membership.payment_unavailable'));
        } else {
          onToast(t('membership.payment_error'));
        }
        return;
      }

      const data = await response.json();

      const checkoutUrl = typeof data.checkout_url === 'string' ? data.checkout_url : ''
      if (!checkoutUrl) {
        onToast(t('membership.payment_unavailable'))
        return
      }
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
    } catch {
      onToast(t('membership.connection_error'));
    }
  }

  const refreshMembership = async () => {
    if (!currentUser) return
    setRefreshing(true)
    try {
      const user = await getMe()
      setCurrentUser(user)
      onToast(user.has_active_vip ? t('membership.vip_refreshed') : t('membership.pending'))
    } catch (error) {
      onToast(error instanceof Error ? error.message : t('membership.refresh_error'))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header className="relative mb-12 overflow-hidden rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-amber-400/10 via-[#15120b] to-violet/10 px-6 py-12 text-center sm:px-10">
        <div className="absolute inset-x-1/4 top-0 h-32 bg-amber-300/10 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-amber-200">
            <Crown className="h-4 w-4" /> DublajLab VIP
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">{t('membership.hero')}</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            {t('membership.hero_desc')}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-7">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{t('membership.free')}</p>
          <h2 className="mt-3 text-3xl font-black text-white">{t('membership.free_title')}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{t('membership.free_desc')}</p>
          <div className="mt-8 text-4xl font-black text-white">₺0</div>
          <div className="mt-7 space-y-3 text-sm text-zinc-300">
            {features.filter((feature) => feature.free !== locked && feature.free !== '—').map((feature) => (
              <div key={feature.name} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-lime" />
                <span>{feature.name}: <strong>{feature.free}</strong></span>
              </div>
            ))}
          </div>
          {!isVip && <div className="mt-8 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-zinc-300">{t('membership.current')}</div>}
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-amber-300/35 bg-gradient-to-b from-amber-300/10 to-white/[0.035] p-7 shadow-[0_24px_80px_rgba(245,158,11,0.08)]">
          <div className="absolute right-5 top-5 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-black">VIP</div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-200">{t('membership.days')}</p>
          <h2 className="mt-3 text-3xl font-black text-white">Stüdyo VIP</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{t('membership.vip_desc')}</p>
          <div className="mt-8 flex items-end gap-2"><span className="text-4xl font-black text-white">{vipPrice}</span><span className="pb-1 text-sm text-zinc-500">{t('membership.period')}</span></div>
          <div className="mt-7 space-y-3 text-sm text-white">
            <div className="flex items-center gap-3"><Check className="h-4 w-4 text-amber-300" /> 1080p MP4 export</div>
            <div className="flex items-center gap-3"><Check className="h-4 w-4 text-amber-300" /> {t('membership.ai_mode')}</div>
            <div className="flex items-center gap-3"><Check className="h-4 w-4 text-amber-300" /> {t('membership.badge')}</div>
          </div>
          {isVip ? (
            <div className="mt-8 rounded-xl border border-lime/25 bg-lime/10 px-4 py-3 text-center text-sm font-black text-lime">{t('membership.active')}</div>
          ) : (
            <button type="button" onClick={startCheckout} className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 py-4 text-sm font-black text-black transition hover:bg-amber-200">
              <Crown className="h-5 w-5" /> {t('membership.buy')}
            </button>
          )}
        </section>
      </div>

      <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-[#111]">
        <div className="grid grid-cols-[1fr_90px_90px] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-4 text-xs font-black uppercase tracking-wider text-zinc-500 sm:grid-cols-[1fr_140px_140px] sm:px-6">
          <span>{t('membership.feature')}</span><span className="text-center">{t('membership.free')}</span><span className="text-center text-amber-200">VIP</span>
        </div>
        {features.map((feature) => (
          <div key={feature.name} className="grid grid-cols-[1fr_90px_90px] gap-3 border-b border-white/5 px-4 py-4 text-sm last:border-0 sm:grid-cols-[1fr_140px_140px] sm:px-6">
            <span className="font-bold text-white">{feature.name}</span><span className="text-center text-zinc-500">{feature.free}</span><span className="text-center font-bold text-amber-200">{feature.vip}</span>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 font-bold text-white"><ShieldCheck className="h-5 w-5 text-lime" /> {t('membership.secure')}</div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{t('membership.secure_desc')}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div className="flex items-center gap-2 font-bold text-white"><LockKeyhole className="h-5 w-5 text-amber-200" /> {t('membership.payment')}</div>
          <p className="mt-2 text-sm leading-6 text-zinc-400">{t('membership.payment_desc')}</p>
        </div>
      </div>

      {currentUser && !isVip && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-violet/20 bg-violet/5 p-5 sm:flex-row">
          <div>
            <div className="flex items-center gap-2 font-bold text-white"><Sparkles className="h-4 w-4 text-violet" /> {t('membership.paid')}</div>
            <p className="mt-1 text-sm text-zinc-400">{t('membership.refresh_desc')}</p>
          </div>
          <button type="button" disabled={refreshing} onClick={() => void refreshMembership()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {t('membership.refresh')}
          </button>
        </div>
      )}
    </div>
  )
}
