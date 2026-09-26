import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { reportPublicDub } from '../lib/api'

interface ReportModalProps {
  projectId: string
  onClose: () => void
  onToast: (msg: string) => void
}

const REASONS = [
  { id: 'copyright', label: 'Telif Hakkı İhlali' },
  { id: 'inappropriate', label: 'Uygunsuz / Sakıncalı İçerik' },
  { id: 'misleading', label: 'Yanıltıcı İçerik / Deepfake' },
  { id: 'personal_data', label: 'Kişisel Veri İhlali' },
  { id: 'other', label: 'Diğer' },
]

export function ReportModal({ projectId, onClose, onToast }: ReportModalProps) {
  const [reason, setReason] = useState(REASONS[0].id)
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await reportPublicDub(projectId, reason, details)
      onToast('Raporunuz başarıyla alındı. Teşekkür ederiz.')
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) {
        onToast(err.message || 'Rapor gönderilemedi.')
      } else {
        onToast('Rapor gönderilemedi.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">İçeriği Raporla</h2>
            <p className="text-sm text-zinc-400">Bu dublaj neden uygunsuz?</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Sebep</label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5 cursor-pointer hover:bg-white/10 transition">
                  <input
                    type="radio"
                    name="reason"
                    value={r.id}
                    checked={reason === r.id}
                    onChange={(e) => setReason(e.target.value)}
                    className="text-lime-400 focus:ring-lime-400 focus:ring-offset-zinc-900 bg-zinc-800 border-zinc-700"
                  />
                  <span className="text-sm text-white">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="details" className="block text-sm font-medium text-zinc-300 mb-2">
              Ek Açıklama (İsteğe Bağlı)
            </label>
            <textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full h-24 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 resize-none"
              placeholder="Detayları buraya yazabilirsiniz..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Gönderiliyor...' : 'Raporla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
