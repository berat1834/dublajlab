import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Play,
  Users,
  Mic2,
  Scale
} from 'lucide-react'
import { fetchTemplate } from '../lib/api'
import type { VideoTemplate } from '../types'
import { VipPromo } from './VipPromo'

interface SceneDetailProps {
  templateId: string
  onBack: () => void
  onPlay: (templateId: string) => void
  onToast: (msg: string) => void
}

function thumbClass(category: string): string {
  const lower = category.toLocaleLowerCase('tr-TR')
  if (lower.includes('komedi') || lower.includes('tepki')) return 'thumb-comedy'
  if (lower.includes('dram')) return 'thumb-drama'
  if (lower.includes('bilim') || lower.includes('kurgu')) return 'thumb-scifi'
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo')) return 'thumb-product'
  return 'thumb-default'
}

export function SceneDetail({ templateId, onBack, onPlay, onToast }: SceneDetailProps) {
  const [template, setTemplate] = useState<VideoTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchTemplate(templateId)
      .then((data) => {
        if (active) {
          setTemplate(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setError('Sahne detayları yüklenemedi.')
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [templateId])

  const characterCount = template?.character_count || 1;
  const playCount = template?.play_count || Math.floor(Math.random() * 5000) + 500;

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">
        Yükleniyor...
      </div>
    )
  }

  if (error || !template) {
    return (
      <div className="py-20 text-center text-red-400">
        {error || 'Sahne bulunamadı.'}
        <br />
        <button onClick={onBack} className="mt-4 text-white underline">Geri Dön</button>
      </div>
    )
  }

  const hasVideoUrl = template.video_url && template.video_url.length > 0;
  // If it's a relative url, we might need to absolute it, but let's just use it in <video> if it exists.
  const videoSrc = hasVideoUrl && template.video_url?.startsWith('/') ? template.video_url : template.video_url

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" /> Ana sayfa / Sahneler / <span className="text-zinc-200">{template.title}</span>
      </button>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left Side: Video Preview */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-glow-lg aspect-video flex items-center justify-center relative">
          {hasVideoUrl ? (
            <video 
              src={videoSrc!} 
              controls 
              className="w-full h-full object-contain bg-zinc-900" 
              poster=""
            />
          ) : (
            <div className={`w-full h-full absolute inset-0 ${thumbClass(template.category)} opacity-60`} />
          )}
          {!hasVideoUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 p-6 text-center">
              <Play className="h-16 w-16 text-white/50 mb-4 drop-shadow-xl" />
              <h2 className="text-2xl font-bold text-white drop-shadow-md">{template.title}</h2>
              <span className="mt-2 inline-block rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase text-white backdrop-blur-md">
                {template.category}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Metadata and Actions */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-black text-white">{template.title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{template.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-1 border-r border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Karakter</span>
              <span className="text-lg font-black text-white">{characterCount}</span>
            </div>
            <div className="flex flex-col gap-1 border-r border-white/10 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Süre</span>
              <span className="text-lg font-black text-white">0:{template.duration_seconds < 10 ? `0${template.duration_seconds}` : template.duration_seconds}</span>
            </div>
            <div className="flex flex-col gap-1 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Oynanma</span>
              <span className="text-lg font-black text-white">{playCount.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => onToast('Oda kurma (Multiplayer) özelliği çok yakında eklenecektir.')} className="rounded-xl bg-lime px-6 py-3.5 text-sm font-bold text-ink hover:bg-[#d5ff78] transition shadow-glow flex-1 flex justify-center items-center gap-2">
              <Users className="h-4 w-4" /> Bu sahneyle oda kur
            </button>
            <button onClick={() => onPlay(template.id)} className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition flex-1 flex justify-center items-center gap-2">
              <Mic2 className="h-4 w-4" /> Tek başına oyna
            </button>
          </div>

          <button onClick={onBack} className="rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-zinc-400 hover:text-white hover:border-white/20 transition w-full">
            Başka sahne seç
          </button>

          <p className="text-[11px] leading-5 text-zinc-500">
            Tek başına oynarsan sahnedeki tüm karakterleri sırayla sen seslendirirsin. 
            <br />
            <span className="mt-2 block">
              <Scale className="h-3 w-3 inline mr-1" /> {template.license} · {template.source}
            </span>
          </p>
        </div>
      </div>

      <hr className="my-12 border-white/10" />

      {/* How to Play Section */}
      <div className="mb-12">
        <h3 className="text-xl font-bold text-white mb-8">Bu sahne nasıl oynanır?</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xs font-bold text-lime mb-2 block">01 / Oda kur</span>
            <p className="text-sm font-bold text-zinc-200 mb-1">Arkadaşlarını çağır veya tek oyna</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Sahneyi ister tek başına üstlen, istersen arkadaşlarına link gönderip karakterleri bölüşün.</p>
          </div>
          <div>
            <span className="text-xs font-bold text-violet mb-2 block">02 / Stüdyo</span>
            <p className="text-sm font-bold text-zinc-200 mb-1">Replikleri kaydet</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Sahne akarken sıran geldiğinde mikrofon ikonuna tıkla ve kendi sesinle canlandır.</p>
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 mb-2 block">03 / İşleme</span>
            <p className="text-sm font-bold text-zinc-200 mb-1">Otomatik Mix</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Tüm kayıtlar tamamlandığında sistem orijinal sesi kısar ve senin sesini sahneye yerleştirir.</p>
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400 mb-2 block">04 / Sonuç</span>
            <p className="text-sm font-bold text-zinc-200 mb-1">MP4 İndir ve Paylaş</p>
            <p className="text-xs text-zinc-500 leading-relaxed">Altyazıların otomatik gömüldüğü yüksek kaliteli videonu indirip her yerde paylaş.</p>
          </div>
        </div>
      </div>

      {/* VIP Promo Banner */}
      <VipPromo onToast={onToast} />

    </div>
  )
}
