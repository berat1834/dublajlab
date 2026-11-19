// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LanguageProvider } from '../LanguageContext'
import { ResultVideoPlayer } from './ResultVideoPlayer'

describe('ResultVideoPlayer', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.setItem('dublajlab-language', 'TR')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    window.localStorage.clear()
  })

  it('shows an always-visible seek control below the result video', async () => {
    await act(async () => {
      root.render(
        <LanguageProvider>
          <ResultVideoPlayer sourceUrl="/result.mp4" />
        </LanguageProvider>,
      )
    })

    const video = container.querySelector('video')
    const seek = container.querySelector<HTMLInputElement>('input[type="range"]')

    expect(video?.getAttribute('src')).toBe('/result.mp4')
    expect(video?.hasAttribute('controls')).toBe(true)
    expect(seek?.getAttribute('aria-label')).toBe('Video zamanı')
    expect(container.textContent).toContain('tam ekran yapmadan')
  })
})
