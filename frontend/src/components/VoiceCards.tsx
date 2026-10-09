import { Bot, Megaphone, Radio, Sparkles, Telescope } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { VoiceStyle } from '../types'
import { useLanguage } from '../LanguageContext'

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
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-3 text-sm font-semibold text-zinc-200">{t('voice.title')}</legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {voices.map((voice) => {
          const Icon = voice.icon
          const selected = value === voice.id
          return (
            <label
              key={voice.id}
              className={`group cursor-pointer rounded-xl border p-3 transition ${
                selected
                  ? 'border-lime/70 bg-lime/10 text-lime shadow-glow'
                  : 'border-white/8 bg-white/[0.025] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="voice-style"
                value={voice.id}
                checked={selected}
                onChange={() => onChange(voice.id)}
              />
              <Icon aria-hidden="true" className="mb-5 h-5 w-5" />
              <span className="block text-sm font-semibold">{t(voice.labelKey)}</span>
              <span className="mt-1 block text-[11px] text-zinc-500 group-hover:text-zinc-400">
                {t(voice.descriptionKey)}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
