import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LanguageProvider } from '../LanguageContext'
import { StudioLocationCard } from './StudioLocationCard'

describe('StudioLocationCard', () => {
  it('renders the representative address with map and directions links', () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <StudioLocationCard />
      </LanguageProvider>,
    )

    expect(html).toContain('DublajLab Stüdyo')
    expect(html).toContain('Maslak, Sarıyer / İstanbul')
    expect(html).toContain('temsili şirket konumudur')
    expect(html).toContain('openstreetmap.org/export/embed.html')
    expect(html).toContain('google.com/maps/dir/')
  })
})
