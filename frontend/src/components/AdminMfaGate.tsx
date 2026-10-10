import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { useLanguage } from '../LanguageContext'
import { getAdminMfaSessionExpiry, verifyAdminMfa } from '../lib/api'

interface AdminMfaGateProps {
  mfaEnabled: boolean
  onSetup: () => void
  children: ReactNode
}

export function AdminMfaGate({ mfaEnabled, onSetup, children }: AdminMfaGateProps) {
  const { t } = useLanguage()
  const [expiresAt, setExpiresAt] = useState(getAdminMfaSessionExpiry)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!expiresAt) return
    const timeout = window.setTimeout(() => setExpiresAt(0), Math.max(0, expiresAt - Date.now()))
    return () => window.clearTimeout(timeout)
  }, [expiresAt])

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setVerifying(true)
    setError('')
    try {
      setExpiresAt(await verifyAdminMfa(code.trim()))
      setCode('')
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : t('mfa.verify_error'))
    } finally {
      setVerifying(false)
    }
  }

  if (!mfaEnabled) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-amber-300" />
        <h1 className="mt-4 text-xl font-black text-white">{t('mfa.title')}</h1>
        <p className="mt-2 text-sm text-zinc-400">{t('mfa.setup_required')}</p>
        <button type="button" onClick={onSetup} className="mt-6 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-black">
          {t('mfa.open_settings')}
        </button>
      </div>
    )
  }

  if (expiresAt > Date.now()) return children

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <form onSubmit={(event) => void handleVerify(event)} className="rounded-xl border border-white/10 bg-zinc-900 p-6">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-lime" />
          <h1 className="text-lg font-black text-white">{t('mfa.challenge_title')}</h1>
        </div>
        <p className="mt-3 text-sm text-zinc-400">{t('mfa.challenge_desc')}</p>
        <input
          type="text"
          autoComplete="one-time-code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="mt-5 w-full rounded-lg border border-white/10 bg-black px-3 py-2.5 text-sm text-white"
          required
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={verifying} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-lime px-4 py-2.5 text-sm font-bold text-black disabled:opacity-50">
          {verifying ? t('auth.waiting') : t('mfa.verify')}
        </button>
        <p className="mt-3 text-center text-xs text-zinc-500">{t('mfa.session_note')}</p>
      </form>
    </div>
  )
}
