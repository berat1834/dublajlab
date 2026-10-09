import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LanguageProvider, useLanguage } from './LanguageContext'

function TranslationProbe() {
  const { language, t } = useLanguage()
  return createElement('span', null, `${language}:${t('studio.cta.start')}:${t('nav.login')}`)
}

describe('LanguageProvider', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('restores the English selection from local storage', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => 'EN',
        setItem: vi.fn(),
      },
    })

    const markup = renderToStaticMarkup(
      createElement(LanguageProvider, null, createElement(TranslationProbe)),
    )

    expect(markup).toContain('EN:Start Dubbing:Login')
  })
})

