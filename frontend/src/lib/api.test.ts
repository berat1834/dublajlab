import { afterEach, describe, expect, it, vi } from 'vitest'
import { absoluteApiUrl, processRecordings, processVideo } from './api'

const queuedJob = {
  job_id: 'job-1',
  status: 'queued',
  progress: 0,
  message: 'Sıraya alındı.',
  output_video_id: null,
  download_url: null,
  error: null,
}

function mockAuthenticatedFetch() {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'vip-token'),
  })
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(queuedJob), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('lip-sync API payloads', () => {
  it('sends lip-sync and auth with an AI job', async () => {
    const fetchMock = mockAuthenticatedFetch()

    await processVideo({
      video_id: 'video-1',
      text: 'Merhaba',
      voice_style: 'dramatic',
      mute_original_audio: true,
      burn_subtitles: true,
      apply_lip_sync: true,
    })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect(init.headers).toMatchObject({ Authorization: 'Bearer vip-token' })
    expect(JSON.parse(String(init.body))).toMatchObject({ apply_lip_sync: true })
  })

  it('sends lip-sync and auth with a microphone job', async () => {
    const fetchMock = mockAuthenticatedFetch()

    await processRecordings({
      videoId: 'video-1',
      timeline: [{ id: 'line-1', start: 0, end: 1, text: 'Merhaba' }],
      recordings: new Map([['line-1', new Blob(['voice'], { type: 'audio/webm' })]]),
      muteOriginalAudio: true,
      burnSubtitles: true,
      applyLipSync: true,
    })

    const init = fetchMock.mock.calls[0][1] as RequestInit
    const formData = init.body as FormData
    expect(init.headers).toMatchObject({ Authorization: 'Bearer vip-token' })
    expect(formData.get('apply_lip_sync')).toBe('true')
  })
})

describe('storage download URLs', () => {
  it('keeps an absolute R2 URL unchanged', () => {
    const url = 'https://media.example.com/exports/video.mp4'
    expect(absoluteApiUrl(url)).toBe(url)
  })

  it('adds the API origin to a local download path', () => {
    expect(absoluteApiUrl('/api/video/download/output-1')).toMatch(
      /\/api\/video\/download\/output-1$/,
    )
  })
})
