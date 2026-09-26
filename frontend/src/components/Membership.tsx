import { useState } from 'react'
import { Check, ShieldCheck, RefreshCw, CreditCard, Copy } from 'lucide-react'
import type { Tab } from '../types'

interface MembershipProps {
  setActiveTab: (tab: Tab) => void
}

export function Membership({}: MembershipProps) {
  const [selectedPlan, setSelectedPlan] = useState<'vip' | 'vip_plus' | null>(null)
  const [agreedToUsername, setAgreedToUsername] = useState(false)

  const vipFeatures = [
    'Hızlı ve öncelikli render',
    '1080p Full HD video çıktısı',
    'Filigransız video çıktısı',
    'Voice FX özel kütüphanesine erişim',
    'Özel VIP sahnelerine erişim',
    'VIP profil rozeti',
    'Discord VIP rolü',
    'Öncelikli sahne önerisi incelemesi',
    'Yalnızca VIP ve VIP+ üyelere oynama'
  ]

  const vipPlusFeatures = [
    'Üyeliği olmayan arkadaşların odana davet et',
    'Tek başına veya arkadaşlarınla oyna',
    'VIP ve VIP+ üyelerle birlikte oyna',
    'Hızlı ve öncelikli render',
    '1080p Full HD video çıktısı',
    'Filigransız videolar',
    'Voice FX özel kütüphanesine erişim',
    'Özel VIP sahnelerine erişim',
    'Özel VIP+ profil rozeti',
    'Discord VIP+ rolü',
    'Öncelikli sahne önerisi incelemesi'
  ]

  const comparisonRows = [
    { name: 'Hızlı render', desc: 'İşlem kuyruğunda sıranın önüne geçersin.', free: false, vip: true, vipPlus: true },
    { name: '1080p çıktı', desc: 'Kaynak izin verdiği ölçüde en yüksek kalite.', free: false, vip: true, vipPlus: true },
    { name: 'Filigransız', desc: 'Finalde DublajLab logosu basılmaz.', free: false, vip: true, vipPlus: true },
    { name: 'Voice FX', desc: 'On beş profesyonel ses efekti.', free: false, vip: true, vipPlus: true },
    { name: 'VIP sahneler', desc: 'Yalnızca üyelere açık sahneler.', free: false, vip: true, vipPlus: true },
    { name: 'VIP rozeti', desc: 'Adının yanında görünür.', free: false, vip: true, vipPlus: true },
    { name: 'Öncelikli öneri', desc: 'Sahne önerin sırada öne geçer.', free: false, vip: true, vipPlus: true },
    { name: 'Discord rolü', desc: 'Sunucuda ayrı rol.', free: false, vip: true, vipPlus: true },
    { name: 'Oda geneli haklar', desc: 'Kurduğun odadaki herkes aynı çıktıyı alır.', free: false, vip: true, vipPlus: true },
    { name: 'Üye olmayan arkadaş daveti', desc: 'Odana üyeliği olmayan arkadaşlarını alırsın. VIP sahnelerde onlar da oynar ve odada kimseden kredi düşülmez.', free: false, vip: false, vipPlus: true },
  ]

  const handleCopyUsername = () => {
    // In a real app, this would be the actual user's username
    navigator.clipboard.writeText('kullanici_adiniz_buraya_gelecek')
  }

  const handleCheckout = () => {
    // Redirect to Shopier or mailto
    window.location.href = "mailto:sales@dublajlab.com?subject=VIP%20Abonelik"
  }

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-0">
      
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 text-xs font-bold text-zinc-400 mb-6">
          DublajLab VIP
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">
          Dublaj daha hızlı, daha<br className="hidden sm:block" /> yüksek kalitede.
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto mb-10">
          Üyelik sahneleri açar, renderı öne alır ve filigransız 1080p çıktı verir.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Kart bilgilerin sunucularımıza ulaşmaz
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Otomatik yenileme yok
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Ödeme onaylanınca üyelik açılır
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-24">
        
        {/* VIP Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 flex flex-col relative overflow-hidden group hover:border-amber-500/50 transition duration-500">
          <div className="absolute top-0 right-0 p-6">
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-amber-500/20 text-xs font-black uppercase tracking-widest text-amber-500">
              ÖNERİLEN
            </div>
          </div>
          <div className="mb-6">
            <div className="text-sm font-black text-white mb-1">.VIP</div>
            <div className="text-sm text-zinc-400">Hızlı render, 1080p, filigran yok</div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">₺199</span>
              <span className="text-sm font-medium text-zinc-500">/ 30 gün</span>
            </div>
            <div className="text-xs font-medium text-zinc-500 mt-1">günde yaklaşık ₺6,63</div>
          </div>

          <div className="space-y-4 flex-1 mb-8">
            {vipFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-zinc-300 leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setSelectedPlan('vip')}
            className="w-full py-4 rounded-xl bg-[#e3cd96] text-black text-sm font-bold hover:brightness-110 transition"
          >
            VIP al
          </button>
        </div>

        {/* VIP+ Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0a0a0a] p-8 flex flex-col relative overflow-hidden hover:border-amber-500/50 transition duration-500">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-sm font-black text-white">VIP+</div>
              <div className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white">EN İYİ DENEYİM</div>
            </div>
            <div className="text-sm text-zinc-400">Arkadaşların VIP üyelik almasına gerek yok.</div>
          </div>
          
          <div className="mb-8">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">₺459</span>
              <span className="text-sm font-medium text-zinc-500">/ 30 gün</span>
            </div>
            <div className="text-xs font-medium text-zinc-500 mt-1">günde yaklaşık ₺15,30</div>
          </div>

          <div className="space-y-4 flex-1 mb-8 border-t border-white/10 pt-8">
            {vipPlusFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-zinc-300 leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setSelectedPlan('vip_plus')}
            className="w-full py-4 rounded-xl bg-[#e3cd96] text-black text-sm font-bold hover:brightness-110 transition"
          >
            VIP al
          </button>
        </div>

      </div>

      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-white">Üyeliğe dahil olanlar</h2>
          <p className="text-sm text-zinc-500 mt-1">Ücretsiz hesap, VIP ve VIP+ arasındaki farklar.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/[0.02] border-b border-white/10">
            <div className="col-span-6">ÖZELLİK</div>
            <div className="col-span-2 text-center">Ücretsiz</div>
            <div className="col-span-2 text-center text-amber-500">VIP</div>
            <div className="col-span-2 text-center text-amber-500">VIP+</div>
          </div>

          <div className="divide-y divide-white/5">
            {comparisonRows.map((row, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-5 items-center hover:bg-white/[0.02] transition">
                <div className="col-span-6">
                  <div className="font-bold text-white text-sm mb-1">{row.name}</div>
                  <div className="text-xs text-zinc-500 leading-relaxed pr-4">{row.desc}</div>
                </div>
                <div className="col-span-2 flex justify-center">
                  {row.free ? <Check className="h-4 w-4 text-zinc-500" /> : <span className="text-zinc-600 font-black">—</span>}
                </div>
                <div className="col-span-2 flex justify-center">
                  {row.vip ? <Check className="h-4 w-4 text-white" /> : <span className="text-zinc-600 font-black">—</span>}
                </div>
                <div className="col-span-2 flex justify-center">
                  {row.vipPlus ? <Check className="h-4 w-4 text-white" /> : <span className="text-zinc-600 font-black">—</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center text-xs font-medium text-zinc-500 max-w-xl mx-auto">
        Ödemeler Shopier altyapısıyla alınır, kart bilgilerin DublajLab sunucularına hiç ulaşmaz. Üyelik dönem sonunda kendiliğinden yenilenmez.
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#111] rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-white/10 shrink-0">
              <h3 className="text-xl font-bold text-white mb-1">Ödemeden önce tek şey</h3>
              <p className="text-sm text-zinc-400">
                {selectedPlan === 'vip' ? '.VIP - ₺199' : 'VIP+ - ₺459'}
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="mb-6 rounded-2xl bg-white/5 p-4 border border-white/10">
                <p className="text-sm text-zinc-300 font-medium mb-3 leading-relaxed">
                  Shopier'deki ödeme formunda Sipariş Notu / Açıklama alanına kullanıcı adını yaz:
                </p>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-black rounded-lg px-4 py-3 text-sm font-bold text-white border border-white/10 flex items-center">
                    kullanici_adiniz
                  </div>
                  <button 
                    onClick={handleCopyUsername}
                    className="px-4 bg-white/10 hover:bg-white/20 transition rounded-lg text-white font-bold text-sm flex items-center gap-2"
                  >
                    Kopyala <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 font-medium">E-posta adresini yazman da olur.</p>
              </div>

              <div className="mb-6 rounded-2xl bg-white/5 p-4 border border-white/10">
                <h4 className="text-sm font-bold text-white mb-2">Ödemeden sonra ne olacak?</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Açıklamaya kullanıcı adını yazdıysan üyeliğin <strong className="text-white">birkaç dakika içinde otomatik tanımlanır</strong>, ayrıca bir şey yapmana gerek yok. Sayfayı yenilediğinde rozetini görürsün.
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Yazmayı unutursan ödemen kaybolmaz ama hangi hesaba ait olduğu anlaşılamaz ve üyeliğin bir yönetici elle bağlayana kadar açılmaz. Bu durumda Discord'dan ya da iletişim adresinden sipariş numaranla yaz.
                </p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition ${agreedToUsername ? 'bg-amber-500 border-amber-500 text-black' : 'border-white/20 bg-black group-hover:border-white/40'}`}>
                  {agreedToUsername && <Check className="h-3.5 w-3.5" />}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreedToUsername}
                  onChange={(e) => setAgreedToUsername(e.target.checked)}
                />
                <span className="text-sm font-bold text-white">Açıklama alanına kullanıcı adımı yazacağım.</span>
              </label>
            </div>

            <div className="p-6 border-t border-white/10 flex gap-3 shrink-0">
              <button 
                onClick={() => {
                  setSelectedPlan(null)
                  setAgreedToUsername(false)
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition"
              >
                Vazgeç
              </button>
              <button 
                disabled={!agreedToUsername}
                onClick={handleCheckout}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition ${agreedToUsername ? 'bg-[#e3cd96] hover:brightness-110 text-black' : 'bg-white/10 text-zinc-500 cursor-not-allowed'}`}
              >
                Shopier'e git (₺)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
