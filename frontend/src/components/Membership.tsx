import { useState } from 'react'
import { Check, ShieldCheck, Zap, Star, Crown, ExternalLink } from 'lucide-react'
import type { Tab } from '../types'

interface MembershipProps {
  setActiveTab: (tab: Tab) => void
}

export function Membership({}: MembershipProps) {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'max' | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const proFeatures = [
    'Öncelikli hızlı render',
    'Yüksek çözünürlük (1080p)',
    'Reklamsız / Filigransız çıktı',
    'Özel Meme Ses Efektleri',
    'Pro rozeti ve Discord Rolü',
  ]

  const maxFeatures = [
    'Oda kurma yetkisi (Çok Oyunculu)',
    'Davet edilen arkadaşlara ücretsiz oynama',
    'Tüm Pro özellikleri dahil',
    'Max rozeti ve Discord Max Rolü',
    'Özel müşteri desteği',
  ]

  const comparisonRows = [
    { name: 'Kuyruk Önceliği', desc: 'Videoların daha hızlı işlenir.', free: false, pro: true, max: true },
    { name: 'HD Çıktı', desc: '1080p kalitesinde indirme.', free: false, pro: true, max: true },
    { name: 'Temiz Görüntü', desc: 'Videolarda watermark olmaz.', free: false, pro: true, max: true },
    { name: 'Özel Efektler', desc: 'Genişletilmiş ses kütüphanesi.', free: false, pro: true, max: true },
    { name: 'Rozet ve Rol', desc: 'Toplulukta öne çıkarsın.', free: false, pro: true, max: true },
    { name: 'Oda Kurma', desc: 'Arkadaşlarınla beraber dublaj yap.', free: false, free_text: 'Yakında', pro: false, max: true },
    { name: 'Ücretsiz Davet', desc: 'Senin odanda oynayanlar kredi harcamaz.', free: false, pro: false, max: true },
  ]

  const handleCheckout = () => {
    // KULLANICI BURAYA KENDİ SHOPİER LİNKİNİ GİRECEK
    // Örnek: window.open('https://shopier.com/SİZİN_ÜRÜN_KODUNUZ', '_blank')
    const shopierUrl = selectedPlan === 'pro' ? 'https://shopier.com/SİZİN_PRO_KODUNUZ' : 'https://shopier.com/SİZİN_MAX_KODUNUZ'
    window.open(shopierUrl, '_blank')
  }

  return (
    <div className="py-12 max-w-6xl mx-auto px-4 sm:px-0">
      
      {/* Header */}
      <div className="text-center mb-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-lime-500/20 blur-[100px] pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lime-500/10 border border-lime-500/20 text-xs font-black text-lime-400 mb-6">
          <Crown className="h-4 w-4" /> MEME DUBLAJ STUDIO PREMIUM
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mb-6 uppercase">
          Sınırları <span className="text-lime-400">Kaldır.</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-xl mx-auto font-medium">
          Daha hızlı render, yüksek kalite ve arkadaşlarınla beraber oynama ayrıcalığı. Topluluğun yıldızı ol.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
        
        {/* Pro Card */}
        <div className="rounded-[2rem] border-2 border-white/5 bg-[#121212] p-8 flex flex-col relative hover:border-lime-500/30 hover:shadow-[0_0_40px_rgba(132,204,22,0.1)] transition-all duration-500">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-white">
                <Star className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide">Stüdyo Pro</h3>
            </div>
            <p className="text-sm text-zinc-400">Tek tabanca takılan profesyoneller için.</p>
          </div>
          
          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">₺249</span>
              <span className="text-sm font-medium text-zinc-500">/ ay</span>
            </div>
          </div>

          <div className="space-y-4 flex-1 mb-10">
            {proFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 bg-lime-500/20 rounded-full p-0.5">
                  <Check className="h-3 w-3 text-lime-400 shrink-0" />
                </div>
                <span className="text-sm font-bold text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setSelectedPlan('pro')}
            className="w-full py-4 rounded-xl border-2 border-zinc-700 text-white text-sm font-black uppercase tracking-wider hover:bg-zinc-800 transition"
          >
            Pro Pakete Geç
          </button>
        </div>

        {/* Max Card */}
        <div className="rounded-[2rem] border-2 border-lime-500/50 bg-gradient-to-b from-[#1a2310] to-[#121212] p-8 flex flex-col relative hover:shadow-[0_0_50px_rgba(132,204,22,0.15)] transition-all duration-500">
          <div className="absolute top-0 right-8 -translate-y-1/2">
            <div className="bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(132,204,22,0.4)]">
              En Popüler
            </div>
          </div>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-lime-400 flex items-center justify-center text-black">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wide">Stüdyo Max</h3>
            </div>
            <p className="text-sm text-zinc-400">Arkadaş grubuyla eğlencenin dibine vurmak isteyenlere.</p>
          </div>
          
          <div className="mb-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-white">₺499</span>
              <span className="text-sm font-medium text-zinc-500">/ ay</span>
            </div>
          </div>

          <div className="space-y-4 flex-1 mb-10 border-t border-white/5 pt-8">
            {maxFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-1 bg-lime-500/20 rounded-full p-0.5">
                  <Check className="h-3 w-3 text-lime-400 shrink-0" />
                </div>
                <span className="text-sm font-bold text-white">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setSelectedPlan('max')}
            className="w-full py-4 rounded-xl bg-lime-400 text-black text-sm font-black uppercase tracking-wider hover:bg-lime-300 shadow-[0_0_20px_rgba(132,204,22,0.2)] transition"
          >
            Max Pakete Geç
          </button>
        </div>

      </div>

      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black text-white uppercase">Özellik Karşılaştırması</h2>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#121212] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-6 text-xs font-black uppercase tracking-widest text-zinc-500 bg-white/5 border-b border-white/10">
            <div className="col-span-6">Özellik</div>
            <div className="col-span-2 text-center">Ücretsiz</div>
            <div className="col-span-2 text-center text-white">Pro</div>
            <div className="col-span-2 text-center text-lime-400">Max</div>
          </div>

          <div className="divide-y divide-white/5">
            {comparisonRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-white/[0.02] transition">
                <div className="col-span-6">
                  <div className="font-bold text-white text-sm mb-1">{row.name}</div>
                  <div className="text-xs text-zinc-500">{row.desc}</div>
                </div>
                <div className="col-span-2 flex justify-center text-sm font-bold text-zinc-500">
                  {row.free ? <Check className="h-5 w-5" /> : (row.free_text || '—')}
                </div>
                <div className="col-span-2 flex justify-center text-white">
                  {row.pro ? <Check className="h-5 w-5" /> : <span className="text-zinc-700 font-black">—</span>}
                </div>
                <div className="col-span-2 flex justify-center text-lime-400">
                  {row.max ? <Check className="h-5 w-5" /> : <span className="text-zinc-700 font-black">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs font-medium text-zinc-500 max-w-2xl mx-auto flex flex-col gap-2">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="h-5 w-5 text-zinc-400" />
          <span>Güvenli Ödeme Altyapısı</span>
        </div>
        <p>Tüm ödeme işlemleri yasal ödeme kuruluşu Shopier güvencesiyle gerçekleşmektedir. Kredi kartı bilgileriniz sistemlerimizde saklanmaz.</p>
        <p>Abonelikler otomatik yenilenmez, dilediğiniz zaman yeni paket satın alabilirsiniz. Mesafeli satış sözleşmesi ve iade koşulları ödeme sayfasında yer almaktadır.</p>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#121212] rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b border-white/5 text-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-lime-400 rounded-b-full"></div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Sipariş Detayı</h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-sm font-bold text-zinc-300">
                {selectedPlan === 'pro' ? 'Stüdyo Pro Paketi' : 'Stüdyo Max Paketi'} 
                <span className={selectedPlan === 'pro' ? 'text-white' : 'text-lime-400'}>
                  ({selectedPlan === 'pro' ? '₺249' : '₺499'})
                </span>
              </div>
            </div>
            
            <div className="p-8 space-y-6 bg-[#0a0a0a]">
              <div className="rounded-2xl bg-lime-500/10 border border-lime-500/20 p-5">
                <h4 className="text-sm font-black text-lime-400 mb-2 uppercase tracking-wide">ÖNEMLİ ADIM</h4>
                <p className="text-sm text-zinc-300 font-medium leading-relaxed">
                  Shopier sayfasına yönlendirileceksiniz. Lütfen ödeme yaparken <strong>"Sipariş Notu"</strong> kısmına kayıtlı <strong className="text-white">E-posta adresinizi</strong> veya <strong className="text-white">Kullanıcı adınızı</strong> yazmayı unutmayın.
                </p>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Sistemimiz ödemenizi notunuzdaki bilgilere göre eşleştirip hesabınızı <strong className="text-white">anında aktif</strong> edecektir. 
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Eğer not eklemeyi unutursanız, işlem dekontunuzla birlikte destek@memedublaj.com adresine ulaşabilirsiniz. İşleminiz manuel olarak tamamlanacaktır.
                </p>
              </div>

              <label className="flex items-start gap-4 cursor-pointer group p-2">
                <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${agreedToTerms ? 'bg-lime-400 border-lime-400 text-black' : 'border-zinc-600 bg-transparent group-hover:border-zinc-400'}`}>
                  {agreedToTerms && <Check className="h-4 w-4" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                />
                <span className="text-sm font-bold text-white leading-snug">Ödeme notuna e-posta adresimi veya kullanıcı adımı yazacağımı anladım.</span>
              </label>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-4 bg-[#121212]">
              <button 
                onClick={() => {
                  setSelectedPlan(null)
                  setAgreedToTerms(false)
                }}
                className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-sm uppercase tracking-wide transition"
              >
                İptal
              </button>
              <button 
                disabled={!agreedToTerms}
                onClick={handleCheckout}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black text-sm uppercase tracking-wide transition ${agreedToTerms ? 'bg-lime-400 hover:bg-lime-300 text-black shadow-[0_0_20px_rgba(132,204,22,0.2)]' : 'bg-white/5 text-zinc-600 cursor-not-allowed'}`}
              >
                Shopier ile Öde <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
