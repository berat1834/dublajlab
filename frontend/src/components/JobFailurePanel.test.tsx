import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { JobFailurePanel } from './JobFailurePanel'

describe('JobFailurePanel', () => {
  it('failed job mesajını görünür hata panelinde gösterir', () => {
    const markup = renderToStaticMarkup(
      <JobFailurePanel
        message="FFmpeg işlemi tamamlanamadı."
        onRetry={() => undefined}
      />,
    )

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('Video oluşturulamadı')
    expect(markup).toContain('FFmpeg işlemi tamamlanamadı.')
    expect(markup).toContain('Export’u tekrar dene')
  })
})
