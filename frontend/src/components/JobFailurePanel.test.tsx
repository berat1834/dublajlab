import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { JobFailurePanel } from './JobFailurePanel'
import { LanguageProvider } from '../LanguageContext'

describe('JobFailurePanel', () => {
  it('failed job mesajını görünür hata panelinde gösterir', () => {
    const markup = renderToStaticMarkup(
      <LanguageProvider>
        <JobFailurePanel
          message="FFmpeg işlemi tamamlanamadı."
        />
      </LanguageProvider>,
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Video oluşturulamadı')
    expect(markup).toContain('FFmpeg işlemi tamamlanamadı.')
  })
})
