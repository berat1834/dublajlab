/* eslint-disable react-refresh/only-export-components */
import {
  Clapperboard,
  Laugh,
  Presentation,
  Rocket,
  Theater,
} from 'lucide-react'
import type { VideoTemplate } from '../types'

const ENGLISH_TEMPLATES: Record<string, { title: string; category: string; description: string; lines: string[] }> = {
  'ofis-surprizi': {
    title: 'An Unexpected Office Moment', category: 'Comedy',
    description: 'A three-line sample timeline for a short, fast-paced office scene.',
    lines: ['Is the meeting really starting now?', 'Who was supposed to prepare the presentation?', 'I am going to get coffee.'],
  },
  'uzay-gorevi': {
    title: 'Mini Space Mission', category: 'Science Fiction',
    description: 'Sample lines for a short two-character space adventure.',
    lines: ['Captain, there is a strange signal on our route.', 'Relax, we only forgot to turn on navigation.'],
  },
  'comedy-reaction': {
    title: 'Funny Reaction', category: 'Comedy',
    description: 'A short scene outline for voicing quick reactions to a surprising moment.',
    lines: ['Wait, did you really do that?', 'I am going to pretend I saw nothing.', 'Okay, tell me again from the beginning.'],
  },
  'dramatic-line': {
    title: 'Dramatic Decision', category: 'Drama',
    description: 'A two-line scene outline for practicing emotional delivery and short pauses.',
    lines: ['Sometimes you have to get lost to find the right path.', 'But this time I will not return.'],
  },
  'product-demo': {
    title: 'Product Introduction', category: 'Presentation',
    description: 'A neutral demo flow for presenting your own product or portfolio project.',
    lines: ['Dub your video in a few steps with DublajLab.', 'Edit the lines and record them with your own voice.', 'Download the result as a subtitled MP4.'],
  },
}

export function localizeTemplate(template: VideoTemplate, language: 'TR' | 'EN'): VideoTemplate {
  if (language === 'TR') return template
  const translation = ENGLISH_TEMPLATES[template.id]
  if (!translation) return template
  return {
    ...template,
    title: translation.title,
    category: translation.category,
    description: translation.description,
    lines: template.lines.map((line, index) => ({
      ...line,
      text: translation.lines[index] || line.text,
    })),
  }
}

/** Map category names to a CSS class for the placeholder thumbnail gradient. */
export function thumbClass(category: string): string {
  const lower = category.toLocaleLowerCase('tr-TR')
  if (lower.includes('komedi') || lower.includes('tepki') || lower.includes('comedy')) return 'thumb-comedy'
  if (lower.includes('dram')) return 'thumb-drama'
  if (lower.includes('bilim') || lower.includes('kurgu') || lower.includes('science')) return 'thumb-scifi'
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo') || lower.includes('presentation')) return 'thumb-product'
  return 'thumb-default'
}

/** Map category to a decorative icon rendered on the placeholder thumbnail. */
export function ThumbIcon({ category }: { category: string }) {
  const lower = category.toLocaleLowerCase('tr-TR')
  const cls = 'h-8 w-8 drop-shadow-lg'
  if (lower.includes('komedi') || lower.includes('tepki') || lower.includes('comedy')) return <Laugh className={cls} />
  if (lower.includes('dram')) return <Theater className={cls} />
  if (lower.includes('bilim') || lower.includes('kurgu') || lower.includes('science')) return <Rocket className={cls} />
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo') || lower.includes('presentation')) return <Presentation className={cls} />
  return <Clapperboard className={cls} />
}

/** Assign a simple difficulty label based on line count and duration. */
export function difficulty(template: VideoTemplate): { label: string; color: string } {
  if (template.lines.length <= 2 && template.duration_seconds <= 8) {
    return { label: 'Kolay', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
  }
  return { label: 'Orta', color: 'text-amber-300 bg-amber-300/10 border-amber-300/20' }
}
