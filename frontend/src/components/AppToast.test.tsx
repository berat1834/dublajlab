import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AppToast } from './AppToast'

describe('AppToast', () => {
  it('renders error messages as an accessible alert', () => {
    const markup = renderToStaticMarkup(createElement(AppToast, {
      message: 'İşlem tamamlanamadı',
      kind: 'error',
      dismissLabel: 'Kapat',
      onDismiss: vi.fn(),
    }))

    expect(markup).toContain('role="alert"')
    expect(markup).toContain('İşlem tamamlanamadı')
    expect(markup).toContain('aria-label="Kapat"')
  })

  it('keeps informational messages polite for screen readers', () => {
    const markup = renderToStaticMarkup(createElement(AppToast, {
      message: 'Bilgi mesajı',
      dismissLabel: 'Kapat',
      onDismiss: vi.fn(),
    }))

    expect(markup).toContain('role="status"')
    expect(markup).toContain('aria-live="polite"')
  })
})
