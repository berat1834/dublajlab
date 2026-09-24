import type {
  ApiErrorBody,
  ProcessResponse,
  UploadResponse,
  TimelineLine,
  VoiceStyle,
} from '../types'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '')

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return response.json() as Promise<T>
  }

  let body: ApiErrorBody = {}
  try {
    body = (await response.json()) as ApiErrorBody
  } catch {
    // The API may be offline or return a proxy error without JSON.
  }
  const validationMessage = body.errors?.map((error) => error.message).join(' ')
  const statusMessage = response.status >= 500
    ? 'Backend isteği tamamlayamadı. Sunucu terminalindeki hata mesajını kontrol edin.'
    : 'İstek tamamlanamadı. Bilgileri kontrol edip tekrar deneyin.'
  throw new Error(validationMessage || body.detail || statusMessage)
}

function backendConnectionError() {
  return new Error(
    'Sunucuya ulaşılamadı. Backend’i http://localhost:8000 adresinde başlatıp tekrar deneyin.',
  )
}

export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  try {
    const response = await fetch(`${API_BASE_URL}/api/video/upload`, {
      method: 'POST',
      body: formData,
    })
    return parseResponse<UploadResponse>(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw backendConnectionError()
    }
    throw error
  }
}

export async function processVideo(payload: {
  video_id: string
  text: string
  voice_style: VoiceStyle
  mute_original_audio: boolean
  burn_subtitles: boolean
}): Promise<ProcessResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/video/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<ProcessResponse>(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw backendConnectionError()
    }
    throw error
  }
}

export async function processRecordings(payload: {
  videoId: string
  timeline: TimelineLine[]
  recordings: Map<string, Blob>
  muteOriginalAudio: boolean
  burnSubtitles: boolean
}): Promise<ProcessResponse> {
  const formData = new FormData()
  const recordingIds = payload.timeline.map((line) => line.id)
  formData.append('video_id', payload.videoId)
  formData.append('timeline', JSON.stringify(payload.timeline))
  formData.append('recording_ids', JSON.stringify(recordingIds))
  formData.append('mute_original_audio', String(payload.muteOriginalAudio))
  formData.append('burn_subtitles', String(payload.burnSubtitles))
  for (const id of recordingIds) {
    const recording = payload.recordings.get(id)
    if (!recording) throw new Error('Her replik için bir kayıt alın.')
    const extension = recording.type.includes('mp4') ? 'm4a' : 'webm'
    formData.append('recordings', recording, `${id}.${extension}`)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/video/process-recordings`, {
      method: 'POST',
      body: formData,
    })
    return parseResponse<ProcessResponse>(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw backendConnectionError()
    }
    throw error
  }
}

export function absoluteApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
