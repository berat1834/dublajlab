// @vitest-environment jsdom

import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { LanguageProvider } from './LanguageContext'

vi.mock('./lib/api', () => ({
  absoluteApiUrl: (path: string) => path,
  clearAdminMfaSession: vi.fn(),
  fetchDemoPolicy: vi.fn().mockResolvedValue({}),
  fetchTemplate: vi.fn(),
  fetchTemplates: vi.fn().mockResolvedValue([]),
  getMe: vi.fn().mockRejectedValue(new Error('anonymous')),
  getMeFromSessionCookie: vi.fn().mockRejectedValue(new Error('anonymous')),
  processRecordings: vi.fn(),
  processVideo: vi.fn(),
  trackProductEvent: vi.fn(),
  uploadVideo: vi.fn().mockResolvedValue({
    video_id: 'upload-1',
    original_filename: 'clip.mp4',
    duration_seconds: 8,
    size_bytes: 4,
    preview_url: '/preview/clip.mp4',
  }),
  waitForJobCompletion: vi.fn(),
}))

vi.mock('./lib/membershipAccess', () => ({
  refreshMembershipUser: vi.fn(),
}))

vi.mock('./components/PlatformNavbar', () => ({
  PlatformNavbar: () => null,
}))

vi.mock('./components/PlatformFooter', () => ({
  PlatformFooter: () => null,
}))

vi.mock('./components/UploadZone', () => ({
  UploadZone: ({ onFile }: { onFile: (file: File) => void }) => (
    <button
      type="button"
      data-testid="upload-zone"
      onClick={() => onFile(new File(['video'], 'clip.mp4', { type: 'video/mp4' }))}
    >
      Select test video
    </button>
  ),
}))

vi.mock('./components/TemplateGallery', () => ({
  TemplateGallery: () => <div data-testid="template-gallery">Template gallery</div>,
}))

vi.mock('./components/TimelineRecorder', () => ({
  TimelineRecorder: () => {
    const [recordingCount, setRecordingCount] = useState(0)
    return (
      <button
        type="button"
        data-testid="timeline-recorder"
        onClick={() => setRecordingCount((count) => count + 1)}
      >
        recordings:{recordingCount}
      </button>
    )
  },
}))

function buttonWithText(container: HTMLElement, text: string) {
  const button = [...container.querySelectorAll('button')]
    .find((candidate) => candidate.textContent?.includes(text))
  if (!button) throw new Error(`Button not found: ${text}`)
  return button as HTMLButtonElement
}

function confirmUploadRights(container: HTMLElement) {
  const checkbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')
  if (!checkbox) throw new Error('Upload rights checkbox not found')
  checkbox.click()
}

describe('studio source switching', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(async () => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    window.localStorage.setItem('dublajlab-language', 'EN')
    window.sessionStorage.setItem('secured', 'true')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
      root.render(
        <LanguageProvider>
          <App />
        </LanguageProvider>,
      )
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('preserves the selected upload and recorder state across source tabs', async () => {
    await act(async () => {
      confirmUploadRights(container)
      buttonWithText(container, 'Select test video').click()
    })

    const recorder = container.querySelector('[data-testid="timeline-recorder"]')
    expect(recorder?.textContent).toBe('recordings:0')

    await act(async () => {
      ;(recorder as HTMLButtonElement).click()
    })
    expect(container.querySelector('[data-testid="timeline-recorder"]')?.textContent)
      .toBe('recordings:1')

    await act(async () => {
      buttonWithText(container, 'Choose a ready scene').click()
    })
    expect(container.querySelector('[data-testid="template-gallery"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="timeline-recorder"]')?.textContent)
      .toBe('recordings:1')

    await act(async () => {
      buttonWithText(container, 'Upload your video').click()
    })
    expect(container.textContent).toContain('clip.mp4')
    expect(container.querySelector('[data-testid="timeline-recorder"]')?.textContent)
      .toBe('recordings:1')
  })

  it('still clears the project through the explicit change-source action', async () => {
    await act(async () => {
      confirmUploadRights(container)
      buttonWithText(container, 'Select test video').click()
    })
    expect(container.querySelector('[data-testid="timeline-recorder"]')).not.toBeNull()

    await act(async () => {
      buttonWithText(container, 'Change source').click()
    })

    expect(container.querySelector('[data-testid="upload-zone"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="timeline-recorder"]')).toBeNull()
  })
})
