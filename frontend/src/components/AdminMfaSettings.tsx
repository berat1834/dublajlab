import { useState, type FormEvent } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import type { User } from '../types'
import { useLanguage } from '../LanguageContext'
import { confirmAdminMfaSetup, getMe, startAdminMfaSetup } from '../lib/api'

interface AdminMfaSettingsProps {
  currentUser: User
  setCurrentUser: (user: User | null) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export function AdminMfaSettings({ currentUser, setCurrentUser, onToast }: AdminMfaSettingsProps) {
  const { t } = useLanguage()
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  if (currentUser.role !== 'admin') return null

  const startSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await startAdminMfaSetup(password)
      setSecret(result.secret)
      setPassword('')
    } catch (error) {
      onToast(error instanceof Error ? error.message : t('mfa.setup_error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const confirmSetup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await confirmAdminMfaSetup(code.trim())
      setRecoveryCodes(result.recovery_codes)
      setCurrentUser(await getMe())
      setCode('')
      onToast(t('mfa.enabled'), 'success')
    } catch (error) {
      onToast(error instanceof Error ? error.message : t('mfa.confirm_error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#0f0f0f] p-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className={`h-5 w-5 ${currentUser.mfa_enabled ? 'text-lime' : 'text-amber-300'}`} />
        <div>
          <h3 className="font-bold text-white">{t('mfa.title')}</h3>
          <p className="mt-1 text-sm text-zinc-400">{currentUser.mfa_enabled ? t('mfa.enabled') : t('mfa.password')}</p>
        </div>
      </div>

      {!currentUser.mfa_enabled && !secret && (
        currentUser.has_password ? (
          <form onSubmit={(event) => void startSetup(event)} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t('account.password')}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2.5 text-sm text-white"
              required
            />
            <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">
              <KeyRound className="h-4 w-4" /> {t('mfa.start')}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-amber-200">{t('mfa.not_available')}</p>
        )
      )}

      {!currentUser.mfa_enabled && secret && (
        <form onSubmit={(event) => void confirmSetup(event)} className="mt-5 space-y-4">
          <div>
            <p className="text-sm text-zinc-300">{t('mfa.manual_setup')}</p>
            <code className="mt-2 block select-all break-all rounded-lg bg-black p-3 font-mono text-sm text-lime">{secret}</code>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black px-3 py-2.5 text-sm text-white"
              required
            />
            <button type="submit" disabled={busy} className="rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">
              {busy ? t('auth.waiting') : t('mfa.confirm')}
            </button>
          </div>
        </form>
      )}

      {recoveryCodes.length > 0 && (
        <div className="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4">
          <h4 className="font-bold text-amber-200">{t('mfa.recovery_title')}</h4>
          <p className="mt-1 text-xs text-zinc-400">{t('mfa.recovery_hint')}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm text-white">
            {recoveryCodes.map((recoveryCode) => <code key={recoveryCode}>{recoveryCode}</code>)}
          </div>
        </div>
      )}
    </section>
  )
}
