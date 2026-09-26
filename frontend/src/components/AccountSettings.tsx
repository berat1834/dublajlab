import { useState } from 'react'
import { User, Shield, Trash2, Edit3, Image as ImageIcon, MessageSquare, Diamond, Fingerprint } from 'lucide-react'
import type { User as UserType } from '../types'

interface AccountSettingsProps {
  currentUser: UserType
  onToast: (msg: string, type?: 'success' | 'error') => void
  setActiveTab: (tab: any) => void
}

export function AccountSettings({ currentUser, onToast, setActiveTab }: AccountSettingsProps) {
  const [username, setUsername] = useState(currentUser.display_name)
  const [bio, setBio] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const handleSaveProfile = () => {
    onToast('Profil başarıyla güncellendi.', 'success')
  }

  return (
    <div className="py-8 max-w-4xl mx-auto pb-24">
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer">
            <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 p-1">
              <div className="h-full w-full bg-[#0a0a0a] rounded-xl flex items-center justify-center overflow-hidden">
                {currentUser.avatar_url ? (
                  <img src={currentUser.avatar_url} alt="avatar" className="h-full w-full object-cover" />
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
              <span className="text-xs font-bold text-zinc-500">Seviye 1</span>
            </div>
          </div>
        </div>
        <button onClick={() => setActiveTab('profile')} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition">
          Herkese açık profilim
        </button>
      </div>

      <div className="space-y-6">
        {/* Membership Card (Custom Lab Theme) */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-6">
          <div className="absolute top-0 left-0 w-1 h-full bg-zinc-700"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1">Deney Statüsü</h3>
              <div className="text-xl font-bold text-white mb-2">Standart Erişim</div>
              <p className="text-sm text-zinc-400 max-w-xl">
                Temel laboratuvar araçlarına erişimin var. VIP protokollere geçerek arkadaşlarınla özel odalar kurabilir ve render önceliği alabilirsin.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button onClick={() => setActiveTab('membership')} className="px-5 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-sm font-bold hover:bg-amber-500/20 transition flex items-center gap-2">
                <Diamond className="h-4 w-4" /> VIP Ol
              </button>
              <button onClick={() => setActiveTab('membership')} className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition">
                Krediler
              </button>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-lime-400" /> Profilini Düzenle
            </h3>
            <p className="text-sm text-zinc-500 mt-1">Bu bilgiler herkese açık profilinde görünür.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">Kullanıcı Adı</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition font-medium"
              />
              <p className="text-xs text-zinc-500 mt-2">Sadece harf ve rakam kullanabilirsin. Ayda bir kez değiştirilebilir.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-300 mb-2">Biyografi (Hakkında)</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Kendinden kısaca bahset. Hangi tür sahneleri seversin?"
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-lime-500 transition font-medium h-24 resize-none"
              ></textarea>
            </div>
            <button onClick={handleSaveProfile} className="px-6 py-2.5 rounded-xl bg-lime-400 text-black text-sm font-bold hover:bg-lime-500 transition">
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>

        {/* Privacy & Discord */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-lime-400" /> Gizlilik
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Profilini kimlerin görebileceğini ayarla. Gizli profiller toplulukta listelenmez.</p>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-black border border-white/10">
              <div>
                <div className="font-bold text-white text-sm">Hesabımı Gizle</div>
                <div className="text-xs text-zinc-500">Sadece sen görebilirsin</div>
              </div>
              <button 
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-colors relative ${isPrivate ? 'bg-lime-500' : 'bg-zinc-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-all ${isPrivate ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#5865F2]/20 bg-[#0f0f0f] p-6 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#5865F2]/10 blur-3xl rounded-full pointer-events-none"></div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-[#5865F2]" /> Discord Bağlantısı
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Discord hesabını bağlayarak topluluk sunucumuzda lab rolünü kap ve seviyene göre özel rozetler kazan.</p>
            </div>
            <button className="w-full py-3 rounded-xl bg-[#5865F2] text-white text-sm font-bold hover:bg-[#4752C4] transition flex items-center justify-center gap-2">
              <MessageSquare className="h-4 w-4" /> Discord Hesabını Bağla
            </button>
          </div>
        </div>

        {/* Security & Danger Zone */}
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 mt-8">
          <h3 className="text-lg font-bold text-red-500 flex items-center gap-2 mb-2">
            <Trash2 className="h-5 w-5" /> Tehlikeli Bölge
          </h3>
          <p className="text-sm text-red-400/80 mb-6">
            Bu işlem geri alınamaz. Hesabını sildiğinde tüm dublajların, projelerin ve verilerin kalıcı olarak yok edilir.
          </p>
          <button className="px-6 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500 hover:text-white transition">
            Hesabımı Kalıcı Olarak Sil
          </button>
        </div>
      </div>
    </div>
  )
}
