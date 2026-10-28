import { useEffect, useRef, useState } from 'react'
import { Bot, LoaderCircle, Megaphone, Pause, Play, Radio, Sparkles, Telescope } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { VoiceStyle } from '../types'
import { useLanguage } from '../LanguageContext'
import { voicePreviewUrl } from '../lib/api'

interface VoiceOption {
  id: VoiceStyle
  labelKey: string
  descriptionKey: string
  icon: LucideIcon
}

const voices: VoiceOption[] = [
  { id: 'announcer', labelKey: 'voice.announcer', descriptionKey: 'voice.announcer_desc', icon: Radio },
  { id: 'robot', labelKey: 'voice.robot', descriptionKey: 'voice.robot_desc', icon: Bot },
  { id: 'dramatic', labelKey: 'voice.dramatic', descriptionKey: 'voice.dramatic_desc', icon: Megaphone },
  {
    id: 'documentary',
    labelKey: 'voice.documentary',
    descriptionKey: 'voice.documentary_desc',
    icon: Telescope,
  },
  { id: 'energetic', labelKey: 'voice.energetic', descriptionKey: 'voice.energetic_desc', icon: Sparkles },
]

interface VoiceCardsProps {
  value: VoiceStyle
  onChange: (value: VoiceStyle) => void
  disabled?: boolean
}

export function VoiceCards({ value, onChange, disabled = false }: VoiceCardsProps) {
  const { t } = useLanguage()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<VoiceStyle | null>(null)
  const [playingVoice, setPlayingVoice] = useState<VoiceStyle | null>(null)
  const [previewError, setPreviewError] = useState('')

  const stopPreview = () => {
    const audio = audioRef.current
    if (audio) {
      audio.onplaying = null
      audio.onended = null
      audio.onerror = null
      audio.pause()
      audio.currentTime = 0
    }
    audioRef.current = null
    setLoadingVoice(null)
    setPlayingVoice(null)
  }

  useEffect(() => () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const handlePreview = async (voiceStyle: VoiceStyle) => {
    if (playingVoice === voiceStyle || loadingVoice === voiceStyle) {
      stopPreview()
      return
    }

    stopPreview()
    setPreviewError('')
    setLoadingVoice(voiceStyle)
    const audio = new Audio(voicePreviewUrl(voiceStyle))
    audio.preload = 'auto'
    audioRef.current = audio
    audio.onplaying = () => {
      if (audioRef.current !== audio) return
      setLoadingVoice(null)
      setPlayingVoice(voiceStyle)
    }
    audio.onended = () => {
      if (audioRef.current !== audio) return
      audioRef.current = null
      setPlayingVoice(null)
    }
    audio.onerror = () => {
      if (audioRef.current !== audio) return
      audioRef.current = null
      setLoadingVoice(null)
      setPlayingVoice(null)
      setPreviewError(t('voice.preview_error'))
    }

    try {
      await audio.play()
    } catch {
      if (audioRef.current !== audio) return
      audioRef.current = null
      setLoadingVoice(null)
      setPlayingVoice(null)
      setPreviewError(t('voice.preview_error'))
    }
  }

  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold text-zinc-200">{t('voice.title')}</legend>
      <p className="mb-3 text-xs text-zinc-500">{t('voice.preview_hint')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {voices.map((voice) => {
          const Icon = voice.icon
          const selected = value === voice.id
          const loading = loadingVoice === voice.id
          const playing = playingVoice === voice.id
          return (
            <div
              key={voice.id}
              className={`group overflow-hidden rounded-xl border transition ${
                selected
                  ? 'border-lime/70 bg-lime/10 text-lime shadow-glow'
                  : 'border-white/8 bg-white/[0.025] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <label className="block cursor-pointer p-3 pb-2">
                <input
                  className="sr-only"
                  type="radio"
                  name="voice-style"
                  value={voice.id}
                  checked={selected}
                  onChange={() => onChange(voice.id)}
                />
                <Icon aria-hidden="true" className="mb-4 h-5 w-5" />
                <span className="block text-sm font-semibold">{t(voice.labelKey)}</span>
                <span className="mt-1 block text-[11px] text-zinc-500 group-hover:text-zinc-400">
                  {t(voice.descriptionKey)}
                </span>
              </label>
              <button
                type="button"
                onClick={() => handlePreview(voice.id)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-white/10 px-2 py-2 text-[11px] font-bold transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`${t(playing ? 'voice.preview_stop' : 'voice.preview_play')} — ${t(voice.labelKey)}`}
              >
                {loading ? (
                  <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                ) : playing ? (
                  <Pause aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                ) : (
                  <Play aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                )}
                {t(loading ? 'voice.preview_loading' : playing ? 'voice.preview_stop' : 'voice.preview_play')}
              </button>
            </div>
          )
        })}
      </div>
      {previewError && (
        <p className="mt-3 text-xs font-medium text-red-300" role="alert">{previewError}</p>
      )}
    </fieldset>
  )
}
