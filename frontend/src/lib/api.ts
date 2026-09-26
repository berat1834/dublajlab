import type {
  ApiErrorBody,
  DemoPolicy,
  JobResponse,
  UploadResponse,
  TimelineLine,
  VideoTemplate,
  VoiceStyle,
  User,
  AuthResponse
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

export async function fetchTemplates(): Promise<VideoTemplate[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates`)
    return parseResponse<VideoTemplate[]>(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw backendConnectionError()
    }
    throw error
  }
}

export async function fetchTemplate(templateId: string): Promise<VideoTemplate> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/templates/${encodeURIComponent(templateId)}`,
    )
    return parseResponse<VideoTemplate>(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw backendConnectionError()
    }
    throw error
  }
}

export async function fetchDemoPolicy(): Promise<DemoPolicy> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/system/demo-policy`)
    return parseResponse<DemoPolicy>(response)
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
}): Promise<JobResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/dubbing-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<JobResponse>(response)
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
}): Promise<JobResponse> {
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
    const response = await fetch(`${API_BASE_URL}/api/jobs/dubbing-recordings`, {
      method: 'POST',
      body: formData,
    })
    return parseResponse<JobResponse>(response)
  } catch (error) {
    if (error instanceof TypeError) {
      throw backendConnectionError()
    }
    throw error
  }
}

export async function fetchJob(
  jobId: string,
  signal?: AbortSignal,
): Promise<JobResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}`,
      { signal },
    )
    return parseResponse<JobResponse>(response)
  } catch (error) {
    if (error instanceof TypeError && !signal?.aborted) {
      throw backendConnectionError()
    }
    throw error
  }
}

function pollingDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, milliseconds)
    const abort = () => {
      window.clearTimeout(timeout)
      reject(new DOMException('Polling iptal edildi.', 'AbortError'))
    }
    if (signal.aborted) {
      abort()
      return
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

export async function waitForJobCompletion(
  jobId: string,
  onUpdate: (job: JobResponse) => void,
  signal: AbortSignal,
): Promise<JobResponse> {
  const deadline = Date.now() + 5 * 60 * 1000
  while (Date.now() < deadline) {
    const job = await fetchJob(jobId, signal)
    onUpdate(job)
    if (job.status === 'completed') return job
    if (job.status === 'failed') {
      throw new Error(job.error || job.message || 'Export tamamlanamadı.')
    }
    await pollingDelay(1000, signal)
  }
  throw new Error('Export bekleme süresi aşıldı. Job durumunu tekrar kontrol edin.')
}

export function absoluteApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// ═══════════════════════════ AUTH API ═══════════════════════════

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return parseResponse<AuthResponse>(response)
}

export async function register(email: string, password: string, display_name: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, display_name }),
  })
  return parseResponse<User>(response)
}

export async function getMe(): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseResponse<User>(response)
}
