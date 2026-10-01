/* eslint-disable react-refresh/only-export-components */
import {
  Clapperboard,
  Laugh,
  Presentation,
  Rocket,
  Theater,
} from 'lucide-react'
import type { VideoTemplate } from '../types'

/** Map category names to a CSS class for the placeholder thumbnail gradient. */
export function thumbClass(category: string): string {
  const lower = category.toLocaleLowerCase('tr-TR')
  if (lower.includes('komedi') || lower.includes('tepki')) return 'thumb-comedy'
  if (lower.includes('dram')) return 'thumb-drama'
  if (lower.includes('bilim') || lower.includes('kurgu')) return 'thumb-scifi'
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo')) return 'thumb-product'
  return 'thumb-default'
}

/** Map category to a decorative icon rendered on the placeholder thumbnail. */
export function ThumbIcon({ category }: { category: string }) {
  const lower = category.toLocaleLowerCase('tr-TR')
  const cls = 'h-8 w-8 drop-shadow-lg'
  if (lower.includes('komedi') || lower.includes('tepki')) return <Laugh className={cls} />
  if (lower.includes('dram')) return <Theater className={cls} />
  if (lower.includes('bilim') || lower.includes('kurgu')) return <Rocket className={cls} />
  if (lower.includes('tanıtım') || lower.includes('ürün') || lower.includes('demo')) return <Presentation className={cls} />
  return <Clapperboard className={cls} />
}

/** Assign a simple difficulty label based on line count and duration. */
export function difficulty(template: VideoTemplate): { label: string; color: string } {
  if (template.lines.length <= 2 && template.duration_seconds <= 8) {
    return { label: 'Kolay', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
  }
  return { label: 'Orta', color: 'text-amber-300 bg-amber-300/10 border-amber-300/20' }
}
