import type { VideoTemplate } from '../types'

export type TemplateSortOption = 'popular' | 'shortest' | 'az'

export function filterAndSortTemplates(
  templates: VideoTemplate[],
  category: string,
  searchQuery: string,
  sortOption: TemplateSortOption,
  locale: string,
): VideoTemplate[] {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase(locale)
  const filtered = templates.filter((template) => {
    if (category && template.category !== category) return false
    if (!normalizedQuery) return true

    return `${template.title} ${template.description}`
      .toLocaleLowerCase(locale)
      .includes(normalizedQuery)
  })

  return [...filtered].sort((left, right) => {
    if (sortOption === 'shortest') return left.duration_seconds - right.duration_seconds
    if (sortOption === 'az') return left.title.localeCompare(right.title, locale)
    return (right.play_count ?? 0) - (left.play_count ?? 0)
  })
}
