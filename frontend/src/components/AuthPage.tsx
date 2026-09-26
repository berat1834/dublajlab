import { useState } from 'react'
import { ArrowRight, Github, Mail, Mic2, PlayCircle } from 'lucide-react'
import type { Tab, User } from '../types'
import { login, register, getMe } from '../lib/api'

interface AuthPageProps {
  mode: 'login' | 'register'
  setActiveTab: (tab: Tab) => void
  onToast: (msg: string) => void
  setCurrentUser?: (user: User) => void
}

export function AuthPage({ mode, setActiveTab, onToast, setCurrentUser }: AuthPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password, name || 'Dublajcı')
        onToast('Kayıt başarılı! Lütfen giriş yapın.')
        setActiveTab('login')
      } else {
        const res = await login(email, password)
        localStorage.setItem('token', res.access_token)
        if (setCurrentUser) {
          const user = await getMe()
          setCurrentUser(user)
        }
        onToast('Giriş başarılı! Stüdyoya yönlendiriliyorsunuz.')
        setActiveTab('play')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu.'
      onToast(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = (provider: string) => {
    onToast(`${provider} ile giriş yakında aktif edilecek. (Demo/Placeholder)`)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col lg:flex-row min-h-[70vh] rounded-3xl bg-white/5 border border-white/10 overflow-hidden shadow-glow-lg my-12">
      
      {/* Left Side: Brand Hero */}
      <div className="flex flex-col justify-between bg-gradient-to-br from-lime/20 via-black to-violet/20 p-8 lg:w-5/12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime shadow-glow">
            <Mic2 className="h-6 w-6 text-ink" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Dublaj<span className="text-lime">Lab</span>
          </span>
        </div>

        <div className="relative z-10 my-12">
          <h1 className="text-3xl font-black text-white sm:text-4xl leading-tight">
            Kendi sesinle <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime to-emerald-400">
              sahnede yerini al.
            </span>
          </h1>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-sm">
            Favori filmlerine, popüler dizilere ve viral videolara kendi sesinle dublaj yap. Arkadaşlarınla paylaş veya toplulukta öne çık.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs font-bold text-zinc-500">
          <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-lime" /> +5.000 Sahne</span>
          <span className="flex items-center gap-1.5"><Mic2 className="w-4 h-4 text-violet" /> AI Destekli Mix</span>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-lime/10 blur-[100px]" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet/10 blur-[100px]" />
      </div>

      {/* Right Side: Form */}
      <div className="flex flex-col justify-center p-8 sm:p-12 lg:w-7/12 bg-black/40">
        <div className="max-w-md w-full mx-auto">
          <h2 className="text-2xl font-black text-white mb-2">
            {mode === 'login' ? 'Tekrar Hoş Geldin' : 'Maceraya Katıl'}
          </h2>
          <p className="text-sm text-zinc-400 mb-8">
            {mode === 'login' 
              ? 'Kaldığın yerden devam etmek için giriş yap.' 
              : 'Ücretsiz hesabını oluştur ve ilk dublajını yap.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1.5">Kullanıcı Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="dublaj_master"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition"
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">E-posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1.5">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-lime focus:outline-none focus:ring-1 focus:ring-lime transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-lime px-4 py-3.5 text-sm font-black text-ink hover:bg-lime/90 transition shadow-glow disabled:opacity-50"
            >
              {loading ? 'Bekleniyor...' : (mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur')} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-black/40 px-2 text-zinc-500 font-bold uppercase tracking-wider">veya</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleSocial('Google')} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white hover:bg-white/10 transition">
              <Mail className="h-4 w-4" /> Google
            </button>
            <button onClick={() => handleSocial('Discord')} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#5865F2]/20 py-3 text-sm font-bold text-white hover:bg-[#5865F2]/40 transition text-[#5865F2]">
              <Github className="h-4 w-4" /> Discord
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-zinc-500">
            {mode === 'login' ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
            <button 
              onClick={() => setActiveTab(mode === 'login' ? 'register' : 'login')}
              className="font-bold text-lime hover:underline"
            >
              {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
