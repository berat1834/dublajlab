import { describe, expect, it } from 'vitest'
import type { VideoTemplate } from '../types'
import { filterAndSortTemplates } from './templateCatalog'

const templates: VideoTemplate[] = [
  {
    id: 'long', title: 'Uzun Sahne', category: 'Dram', description: 'Duygulu',
    duration_seconds: 12, video_url: null, license: 'CC0', source: 'test',
    is_demo: true, lines: [], play_count: 4, character_count: 1,
  },
  {
    id: 'short', title: 'Kısa Sahne', category: 'Komedi', description: 'Komik tepki',
    duration_seconds: 5, video_url: null, license: 'CC0', source: 'test',
    is_demo: true, lines: [], play_count: 10, character_count: 1,
  },
]

describe('filterAndSortTemplates', () => {
  it('filters by category and localized search text', () => {
    expect(filterAndSortTemplates(templates, 'Komedi', 'TEPKİ', 'popular', 'tr-TR'))
      .toEqual([templates[1]])
  })

  it('sorts without mutating the API response order', () => {
    const originalOrder = templates.map((template) => template.id)

    expect(filterAndSortTemplates(templates, '', '', 'shortest', 'tr-TR').map((item) => item.id))
      .toEqual(['short', 'long'])
    expect(templates.map((template) => template.id)).toEqual(originalOrder)
  })
})
