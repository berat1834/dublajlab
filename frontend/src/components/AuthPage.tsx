import { useState } from 'react'
import { ArrowRight, Check, Eye, EyeOff, Github, Mail, MailCheck, Mic2, PlayCircle, RefreshCw, X } from 'lucide-react'
import type { Tab, User } from '../types'
import { login, register, getMe, resendVerification } from '../lib/api'
import { useLanguage } from '../LanguageContext'
import { useEffect } from 'react'
import { evaluatePassword } from '../lib/passwordPolicy'

interface AuthPageProps {
  mode: 'login' | 'register'
  setActiveTab: (tab: Tab) => void
  onToast: (msg: string) => void
  setCurrentUser?: (user: User) => void
}

export function AuthPage({ mode, setActiveTab, onToast, setCurrentUser }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationNotice, setVerificationNotice] = useState<
    'sent' | 'success' | 'invalid' | 'expired' | null
  >(null)
  const [resending, setResending] = useState(false)
  const { t } = useLanguage()
  const passwordEvaluation = evaluatePassword(password, email, name)
  const passwordsMatch = password.length > 0 && password === passwordConfirmation

  // Kullanıcı zaten login ise yönlendir
  useEffect(() => {
    if (localStorage.getItem('token')) {
      setActiveTab('play')
    }
  }, [setActiveTab])

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('email_verification')
    if (result === 'success' || result === 'invalid' || result === 'expired') {
      setVerificationNotice(result)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        if (!passwordEvaluation.isValid) {
          onToast(t('auth.password.invalid'))
          return
        }
        if (!passwordsMatch) {
          onToast(t('auth.password.mismatch'))
          return
        }
        const registeredUser = await register(email, password, name || t('auth.default_name'))
        if (registeredUser.email_verification_required) {
          setVerificationNotice('sent')
          onToast(t('auth.verification_sent'))
        } else {
          onToast(t('auth.register_success'))
        }
        setActiveTab('login')
      } else {
        const res = await login(email, password)
        localStorage.setItem('token', res.access_token)
        if (setCurrentUser) {
          const user = await getMe()
          setCurrentUser(user)
        }
        onToast(t('auth.login_success'))
        setActiveTab('play')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.generic_error')
      onToast(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email.trim()) return
    setResending(true)
    try {
      await resendVerification(email)
      setVerificationNotice('sent')
      onToast(t('auth.verification_resend_done'))
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : t('auth.generic_error'))
    } finally {
      setResending(false)
    }
  }

  const handleSocial = (provider: 'Google' | 'Discord') => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    const returnTo = encodeURIComponent(window.location.origin)
    window.location.href = `${baseUrl}/api/auth/${provider.toLowerCase()}/login?return_to=${returnTo}`
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row min-h-[70vh] rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-glow-lg my-12">
      
      {/* Left Side: Brand Hero */}
      <div className="flex flex-col justify-between bg-gradient-to-br from-lime/20 via-black to-violet/20 p-8 lg:w-5/12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <img src="/assets/dublajlab-logo.svg" alt="DublajLab" className="h-11 w-auto max-w-[205px]" />
        </div>

        <div className="relative z-10 my-12">
          <h1 className="text-3xl font-black text-white sm:text-4xl leading-tight">
            {t('auth.hero.title1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-emerald-400">
              {t('auth.hero.title2')}
            </span>
          </h1>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-sm">
            {t('auth.hero.desc')}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs font-bold text-zinc-500">
          <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-lime" /> {t('auth.feature.scenes')}</span>
          <span className="flex items-center gap-1.5"><Mic2 className="w-4 h-4 text-violet" /> {t('auth.feature.ai_mix')}</span>
        </div>

        {/* Decorative elements & Floating Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[10%] left-[10%] -rotate-12 text-zinc-400 font-bold whitespace-nowrap blur-[1px] animate-pulse">{t('auth.quote.1')}</div>
          <div className="absolute top-[30%] left-[50%] rotate-6 text-zinc-300 font-bold whitespace-nowrap blur-[2px] animate-pulse delay-700">{t('auth.quote.2')}</div>
          <div className="absolute top-[60%] left-[20%] -rotate-6 text-zinc-500 font-bold whitespace-nowrap animate-pulse delay-300">{t('auth.quote.3')}</div>
          <div className="absolute top-[80%] left-[60%] rotate-12 text-zinc-400 font-bold whitespace-nowrap blur-[1px] animate-pulse delay-1000">{t('auth.quote.4')}</div>
        </div>
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-lime/10 blur-[100px]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet/10 blur-[100px]" />
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:w-7/12 bg-black/40">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-2xl font-black text-white mb-2">
            {mode === 'login' ? t('auth.login.title') : t('auth.register.title')}
          </h2>
          <p className="text-sm text-zinc-400 mb-8">
            {mode === 'login' 
              ? t('auth.login.desc') 
              : t('auth.register.desc')}
          </p>

          {verificationNotice && (
            <div className={`mb-5 rounded-xl border p-4 text-sm leading-6 ${verificationNotice === 'success' || verificationNotice === 'sent' ? 'border-lime/25 bg-lime/10 text-lime' : 'border-amber-300/25 bg-amber-300/10 text-amber-100'}`}>
              <div className="flex items-start gap-3">
                <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p>
                    {verificationNotice === 'sent' && t('auth.verification_sent')}
                    {verificationNotice === 'success' && t('auth.verification_success')}
                    {verificationNotice === 'invalid' && t('auth.verification_invalid')}
                    {verificationNotice === 'expired' && t('auth.verification_expired')}
                  </p>
                  {(verificationNotice === 'invalid' || verificationNotice === 'expired') && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={!email.trim() || resending}
                      className="mt-2 inline-flex items-center gap-1.5 font-bold text-white underline decoration-white/30 underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                      {t('auth.verification_resend')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t('auth.username')}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="dublaj_master"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-500 transition hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex gap-1.5" aria-label={t('auth.password.strength')}>
                  {[1, 2, 3].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        passwordEvaluation.score >= level
                          ? passwordEvaluation.score === 1
                            ? 'bg-red-400'
                            : passwordEvaluation.score === 2
                              ? 'bg-amber-300'
                              : 'bg-lime'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-bold text-zinc-300">
                  {t('auth.password.strength')}: {t(`auth.password.strength.${passwordEvaluation.score}`)}
                </p>
                <ul className="space-y-1.5 text-xs text-zinc-400">
                  {[
                    [passwordEvaluation.longEnough, t('auth.password.rule.length')],
                    [passwordEvaluation.notCommon, t('auth.password.rule.common')],
                    [passwordEvaluation.excludesIdentity, t('auth.password.rule.identity')],
                  ].map(([valid, label]) => (
                    <li key={String(label)} className="flex items-center gap-2">
                      {valid ? <Check className="h-3.5 w-3.5 text-lime" /> : <X className="h-3.5 w-3.5 text-zinc-600" />}
                      <span className={valid ? 'text-zinc-300' : undefined}>{label}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] leading-5 text-zinc-500">
                  {t('auth.password.suggestion')}
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-zinc-400">
                    {t('auth.password.confirm')}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                    required
                    placeholder="••••••••••"
                    className={`w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition ${
                      passwordConfirmation && !passwordsMatch
                        ? 'border-red-400/60 focus:border-red-400 focus:ring-red-400'
                        : 'border-white/10 focus:border-lime focus:ring-lime'
                    }`}
                  />
                  {passwordConfirmation && !passwordsMatch && (
                    <p className="mt-1.5 text-xs text-red-300">{t('auth.password.mismatch')}</p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && (!passwordEvaluation.isValid || !passwordsMatch))}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3.5 text-sm font-black text-ink hover:bg-lime/90 transition shadow-glow disabled:opacity-50"
            >
              {loading ? t('auth.waiting') : (mode === 'login' ? t('auth.login.action') : t('auth.register.action'))} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black/40 px-2 text-zinc-500 font-bold uppercase tracking-wider">{t('auth.or')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => handleSocial('Google')} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition">
              <Mail className="h-4 w-4" /> Google
            </button>
            <button type="button" onClick={() => handleSocial('Discord')} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#5865F2]/20 py-3 text-sm font-bold hover:bg-[#5865F2]/40 transition text-[#5865F2]">
              <Github className="h-4 w-4" /> Discord
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-zinc-500">
            {mode === 'login' ? `${t('auth.no_account')} ` : `${t('auth.have_account')} `}
            <button 
              onClick={() => setActiveTab(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-lime hover:underline"
            >
              {mode === 'login' ? t('auth.signup_link') : t('auth.login_link')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
