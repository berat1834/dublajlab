import { useState } from 'react'
import { User, Shield, Trash2, Edit3, Image as ImageIcon, MessageSquare, Diamond, Fingerprint } from 'lucide-react'
import type { User as UserType, Tab } from '../types'
import { deleteAccount, updateProfile } from '../lib/api'
import { useLanguage } from '../LanguageContext'

interface AccountSettingsProps {
  currentUser: UserType
  setCurrentUser: (user: UserType | null) => void
  onToast: (msg: string, type?: 'success' | 'error') => void
  setActiveTab: (tab: Tab) => void
}

export function AccountSettings({ currentUser, setCurrentUser, onToast, setActiveTab }: AccountSettingsProps) {
  const { t } = useLanguage()
  const [username, setUsername] = useState(currentUser.display_name)
  const [avatar, setAvatar] = useState(currentUser.avatar_url || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteUsername, setDeleteUsername] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const updatedUser = await updateProfile(username.trim(), avatar.trim() || null)
      setCurrentUser(updatedUser)
      onToast(t('account.saved_success'), 'success')
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : t('account.err_generic'), 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (deleteUsername !== currentUser.display_name) {
      onToast(t('account.err_username_mismatch'), 'error')
      return
    }
    if (currentUser.has_password && !deletePassword) {
      onToast(t('account.err_password_req'), 'error')
      return
    }
    
    setIsDeleting(true)
    try {
      await deleteAccount(deleteUsername, deletePassword)
      setCurrentUser(null)
      localStorage.removeItem('token')
      setActiveTab('play')
      onToast(t('account.deleted_success'), 'success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('account.err_generic')
      onToast(message, 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDiscordConnect = () => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
    window.location.href = `${baseUrl}/api/auth/discord/login`
  }

  return (
    <div className="py-8 max-w-4xl mx-auto pb-24">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 p-1">
              <div className="h-full w-full bg-[#0a0a0a] rounded-xl flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-lime-400" />
                )}
              </div>
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition backdrop-blur-sm">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">{currentUser.display_name}</h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-bold text-zinc-300">
                <Fingerprint className="h-3 w-3 text-lime-400" />
                Acemi Denek
              </span>
              <span className="text-xs font-bold text-zinc-500">{t('account.level_1')}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setActiveTab('profile')} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition">
          {t('account.public_profile')}
        </button>
      </div>

      <div className="space-y-6">
        {/* Membership Card (Custom Lab Theme) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
          <div className={`absolute top-0 left-0 w-1 h-full ${currentUser.has_active_vip ? 'bg-amber-300' : 'bg-zinc-700'}`}></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">{t('account.status_title')}</h3>
              <div className="text-xl font-bold text-white mb-2">{currentUser.has_active_vip ? t('account.vip_access') : t('account.free_access')}</div>
              <p className="text-sm text-zinc-400 max-w-xl">
                {currentUser.has_active_vip
                  ? t('account.vip_desc')
                  : t('account.free_desc')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button onClick={() => setActiveTab('membership')} className="px-5 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm font-bold hover:bg-amber-500/20 transition flex items-center gap-2">
                <Diamond className="h-4 w-4" /> {currentUser.has_active_vip ? t('account.vip_details') : t('account.go_vip')}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-lime-400" /> {t('account.edit_title')}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">{t('account.edit_desc')}</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">{t('account.username')}</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition font-medium"
              />
              <p className="text-xs text-zinc-500 mt-2">{t('account.username_hint')}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">{t('account.bio')}</label>
              <textarea 
                placeholder={t("account.bio_placeholder")}
                disabled
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-500 font-medium h-24 resize-none cursor-not-allowed"
              ></textarea>
              <p className="text-xs text-amber-400/80 mt-2">{t('account.coming_soon')}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">{t('account.avatar')}</label>
              <input 
                type="text" 
                placeholder="https://..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition font-medium"
              />
              <p className="text-xs text-zinc-500 mt-2">{t('account.avatar_hint')}</p>
            </div>
            <button disabled={isSaving} onClick={handleSaveProfile} className="px-6 py-2.5 rounded-xl bg-lime-400 text-black text-sm font-bold hover:bg-lime-500 transition disabled:opacity-50">
              {isSaving ? t('account.saving') : t('account.save_changes')}
            </button>
          </div>
        </div>

        {/* Account Details (Email & Password) */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
          <h3 className="text-lg font-bold text-white mb-4">{t('account.security_title')}</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-zinc-300">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              <span>{t('account.email_unverified')}</span>
            </div>
            <div className="text-sm text-zinc-400">
              {t('account.pw_reset_prefix')}
              <a href="mailto:destek@dublajlab.com.tr?subject=Şifre%20Sıfırlama" className="text-white font-bold underline hover:text-lime-400 transition">{t('account.contact_support')}</a>
            </div>
          </div>
        </div>

        {/* Privacy & Discord */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-lime-400" /> Gizlilik
              </h3>
              <p className="text-sm text-zinc-400 mb-6">{t('account.privacy_desc')}</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-black border border-white/10">
              <div>
                <div className="font-bold text-white text-sm">{t('account.hide_account')}</div>
                <div className="text-xs text-zinc-500">{t('account.only_you')}</div>
              </div>
              <button
                disabled
                aria-label={t('account.coming_soon')}
                className="w-12 h-6 rounded-full relative bg-zinc-800 opacity-60 cursor-not-allowed"
              >
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black"></div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#5865F2]/20 bg-[#0f0f0f] p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#5865F2]/10 blur-3xl rounded-full pointer-events-none"></div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-[#5865F2]" /> {t('account.discord_title')}
              </h3>
              <p className="text-sm text-zinc-400 mb-6">{t('account.discord_desc')}</p>
            </div>
            {currentUser.discord_linked ? (
              <div className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#5865F2]" /> {currentUser.display_name} {t('account.connected')}
              </div>
            ) : (
              <button onClick={handleDiscordConnect} className="w-full py-3 rounded-xl bg-[#5865F2] text-white text-sm font-bold hover:bg-[#4752C4] transition flex items-center justify-center gap-2">
                <MessageSquare className="h-4 w-4" /> {t('account.connect_discord')}
              </button>
            )}
          </div>
        </div>

        {/* Security & Danger Zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 mt-8">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-2">
            <Trash2 className="h-5 w-5" /> {t('account.del_title')}
          </h3>
          <p className="text-sm text-red-400/80 mb-4">
            {t('account.del_warning')}
          </p>
          <ul className="list-disc pl-5 text-sm text-red-400/70 space-y-2 mb-6">
            <li>{t('account.del_rule1')}</li>
            <li>{t('account.del_rule2')}</li>
            <li>{t('account.del_rule3')}</li>
            <li>{t('account.del_rule4')}</li>
          </ul>
          <p className="text-xs text-red-500/50 mb-6">
            {t('account.del_kvkk')}
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition">
              {t('account.want_to_delete')}
            </button>
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-black/40 p-5 mt-4">
              <div className="mb-4">
                <label className="block text-xs font-bold text-red-400 mb-1.5">{t('account.confirm_username')} <span className="text-white">{currentUser.display_name}</span></label>
                <input 
                  type="text" 
                  value={deleteUsername}
                  onChange={(e) => setDeleteUsername(e.target.value)}
                  className="w-full bg-black border border-red-500/30 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>
              {currentUser.has_password && <div className="mb-6">
                <label className="block text-xs font-bold text-red-400 mb-1.5">{t('account.password')}</label>
                <input 
                  type="password" 
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full bg-black border border-red-500/30 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-500 transition"
                />
              </div>}
              <p className="text-xs text-red-400 mb-4 font-medium">{t('account.verify_ownership')}</p>
              <div className="flex items-center gap-3">
                <button disabled={isDeleting} onClick={handleDelete} className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition shadow-lg shadow-red-900/20 disabled:opacity-50">
                  {isDeleting ? t('account.deleting') : t('account.delete_permanently')}
                </button>
                <button disabled={isDeleting} onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5 text-sm font-bold transition disabled:opacity-50">
                  {t('account.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
