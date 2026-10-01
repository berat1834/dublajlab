import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

type PageId = 'about' | 'contact' | 'privacy' | 'terms' | 'copyright' | 'refund' | 'distance_selling'

interface LegalCorporateModalProps {
  pageId: PageId
  onClose: () => void
}

export function LegalCorporateModal({ pageId, onClose }: LegalCorporateModalProps) {
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
            <h2 className="text-xl font-bold text-white mb-4">Hakkımızda (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>DublajLab, kısa videolarınızı tarayıcı üzerinden kendi sesinizle dublajlamanızı sağlayan yaratıcı bir medya aracıdır.</p>
              <p>Bu platform şu an "Public Beta" aşamasındadır. Kullanıcıların yaratıcılıklarını sergilemeleri ve portföy içerikleri üretmeleri için tasarlanmıştır.</p>
              <p>Ekibimiz, video düzenleme süreçlerini olabildiğince basitleştirerek herkesin kendi sesinden hikayeler anlatabilmesini hedefliyor.</p>
            </div>
          </>
        )
      case 'contact':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">İletişim (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>DublajLab Public Beta süresince resmi destek kanallarımız sınırlıdır. Geri bildirimleriniz ve hata bildirimleriniz bizim için çok değerlidir.</p>
              <p>Bize aşağıdaki e-posta adresinden ulaşabilirsiniz:</p>
              <p className="font-mono text-[#B8FF4D]">hello@dublajlab.com (Örnek)</p>
              <p className="text-xs text-zinc-500 mt-4">* Sosyal medya hesaplarımız yakında aktif edilecektir.</p>
            </div>
          </>
        )
      case 'privacy':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">Gizlilik Politikası (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>DublajLab, kişisel verilerinizin güvenliğine önem verir. Bu metin Public Beta süreci için bir bilgilendirmedir.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Medya Verileri:</strong> Tarayıcı üzerinden kaydettiğiniz sesler sadece export işlemi için sunucuya iletilir ve işlem bittikten sonra geçici sunuculardan silinir.</li>
                <li><strong>Kalıcı Saklama:</strong> Üye olan kullanıcıların projeleri ve indirmeye hazır MP4 çıktıları sunucularımızda saklanır. Depolama temizlik politikalarımız (cleanup) eski dosyaları silebilir.</li>
                <li><strong>Üçüncü Taraflar:</strong> Verileriniz izniniz olmadan üçüncü taraf reklam şirketlerine satılmaz. Sadece hizmeti sunmak için gereken bulut sağlayıcıları (örn. Cloudflare, Railway) kullanılır.</li>
              </ul>
            </div>
          </>
        )
      case 'terms':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">Kullanım Koşulları (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>DublajLab hizmetlerini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Kullanıcılar sisteme yükledikleri tüm video ve ses içeriklerinden bizzat sorumludur.</li>
                <li>Hizmet şu an "Public Beta" aşamasında olup, kesintiler veya veri kayıpları yaşanabilir.</li>
                <li>Kötüye kullanım (DDoS, API limitlerini aşma çabası) durumunda hesabınız veya IP adresiniz engellenebilir.</li>
              </ul>
            </div>
          </>
        )
      case 'copyright':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">Telif Bildirimi (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p>DublajLab platformunda paylaşılan veya yüklenen içeriklerin fikri mülkiyet haklarına saygı duyuyoruz.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Sadece kullanım hakkına sahip olduğunuz veya kamuya açık (CC0 vb.) videoları yükleyin.</li>
                <li>Gerçek kişilerin seslerini taklit etmek (deepfake) veya onları yanıltıcı durumlara sokmak yasaktır.</li>
                <li>Eğer telif hakkına sahip olduğunuz bir materyalin izinsiz kullanıldığını düşünüyorsanız, iletişim kanallarımızdan bize bildirebilirsiniz. İçerik incelenip yayından kaldırılacaktır.</li>
              </ul>
            </div>
          </>
        )
      case 'refund':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">İade ve İptal Koşulları (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p><strong>Not:</strong> Şu an sistemimizde Shopier ödeme entegrasyonu (VIP) aktif değildir. Aşağıdaki kurallar ödeme alındığında geçerli olacaktır.</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Satın alınan VIP üyelikler dijital hizmet niteliğinde olduğundan, hizmet kullanılmaya başlandıktan sonra cayma hakkı kural olarak geçerli değildir.</li>
                <li>Teknik bir nedenden ötürü (sistemin sürekli çökmesi vb.) vaat edilen hizmet hiç verilememişse, destek talebi üzerinden iade incelenebilir.</li>
              </ul>
            </div>
          </>
        )
      case 'distance_selling':
        return (
          <>
            <h2 className="text-xl font-bold text-white mb-4">Mesafeli Satış Sözleşmesi (Taslak)</h2>
            <div className="space-y-4 text-sm text-zinc-300">
              <p><strong>Madde 1 - Taraflar:</strong> Bu sözleşme DublajLab (Satıcı) ile VIP/Premium hizmet alan kullanıcı (Alıcı) arasındadır. (Şu an test aşamasındadır, yasal satıcı ünvanı atanmamıştır).</p>
              <p><strong>Madde 2 - Konu:</strong> Sözleşmenin konusu, alıcının dijital VIP hizmeti satın alması ve bu hizmetin elektronik ortamda anında teslimidir.</p>
              <p><strong>Madde 3 - Teslimat:</strong> Satın alım tamamlandıktan hemen sonra üyelik statüsü güncellenir ve yüksek çözünürlük gibi özellikler aktifleşir.</p>
              <p><strong>Not:</strong> Gerçek ticari faaliyet başladığında bu sayfa hukuk metni ile güncellenecektir.</p>
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
              <h3 className="font-medium text-white">Yasal ve Kurumsal</h3>
              <p className="text-xs text-zinc-400">Public Beta Bilgilendirmesi</p>
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
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
