import type {
  ApiErrorBody,
  DemoPolicy,
  JobResponse,
  UploadResponse,
  TimelineLine,
  VideoTemplate,
  VoiceStyle,
  User,
  AuthResponse,
  DubbingProject,
  DubbingExport
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
  apply_lip_sync: boolean
}): Promise<JobResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/dubbing-ai`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
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
  applyLipSync: boolean
}): Promise<JobResponse> {
  const formData = new FormData()
  const recordingIds = payload.timeline.map((line) => line.id)
  formData.append('video_id', payload.videoId)
  formData.append('timeline', JSON.stringify(payload.timeline))
  formData.append('recording_ids', JSON.stringify(recordingIds))
  formData.append('mute_original_audio', String(payload.muteOriginalAudio))
  formData.append('burn_subtitles', String(payload.burnSubtitles))
  formData.append('apply_lip_sync', String(payload.applyLipSync))
  for (const id of recordingIds) {
    const recording = payload.recordings.get(id)
    if (!recording) throw new Error('Her replik için bir kayıt alın.')
    const extension = recording.type.includes('mp4') ? 'm4a' : 'webm'
    formData.append('recordings', recording, `${id}.${extension}`)
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/jobs/dubbing-recordings`, {
      method: 'POST',
      headers: getAuthHeaders(),
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
  if (/^https?:\/\//i.test(path)) return path
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

export async function updateProfile(display_name: string, avatar_url: string | null): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/me/profile`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ display_name, avatar_url }),
  })
  return parseResponse<User>(response)
}

export async function deleteAccount(confirmation: string, password?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/me/account`, {
    method: 'DELETE',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ confirmation, password: password || null })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || 'Hesap silinirken bir hata oluştu.')
  }
}

// ═══════════════════════════ USER LIBRARY API ═══════════════════════════

export async function getUserProjects(): Promise<DubbingProject[]> {
  const response = await fetch(`${API_BASE_URL}/api/me/projects`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseResponse<DubbingProject[]>(response)
}

export async function getUserExports(): Promise<DubbingExport[]> {
  const response = await fetch(`${API_BASE_URL}/api/me/exports`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseResponse<DubbingExport[]>(response)
}

export async function deleteUserProject(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/me/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!response.ok) {
    let body: ApiErrorBody = {}
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      // empty
    }
    throw new Error(body.detail || 'Proje silinemedi.')
  }
}

export async function updateProjectVisibility(projectId: string, visibility: 'public' | 'private'): Promise<DubbingProject> {
  const response = await fetch(`${API_BASE_URL}/api/me/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ visibility })
  })
  return parseResponse<DubbingProject>(response)
}

// ═══════════════════════════ PUBLIC DUBS API ═══════════════════════════

export interface PublicDub {
  project_id: string
  title: string
  display_name: string
  created_at: string
  duration_seconds: string | null
  download_url: string | null
  view_count: number
  like_count: number
  liked_by_me: boolean
}

export async function getPublicDubs(): Promise<PublicDub[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/dubs`, {
    method: 'GET'
  })
  return parseResponse<PublicDub[]>(response)
}

export async function reportPublicDub(projectId: string, reason: string, details?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/public/dubs/${projectId}/report`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reason, details })
  })
  if (!response.ok) {
    throw new Error('Rapor gönderilemedi.')
  }
}

export async function toggleLikePublicDub(projectId: string, isLiking: boolean): Promise<void> {
  const method = isLiking ? 'POST' : 'DELETE'
  const response = await fetch(`${API_BASE_URL}/api/public/dubs/${projectId}/like`, {
    method,
    headers: getAuthHeaders()
  })
  if (!response.ok) {
    throw new Error('Beğeni işlemi başarısız.')
  }
}

export async function recordViewPublicDub(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/public/dubs/${projectId}/view`, {
    method: 'POST'
  })
  if (!response.ok) {
    // Silently fail view counts, not critical
  }
}

export interface CommentResponse {
  id: string
  project_id: string
  user_id: string
  display_name: string
  body: string
  created_at: string
  is_mine: boolean
}

export async function getPublicDubComments(projectId: string): Promise<CommentResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/dubs/${projectId}/comments`, {
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error('Yorumlar alınamadı.')
  return response.json()
}

export async function addPublicDubComment(projectId: string, body: string): Promise<CommentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/public/dubs/${projectId}/comments`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ body })
  })
  if (!response.ok) throw new Error('Yorum gönderilemedi.')
  return response.json()
}

export async function deletePublicDubComment(projectId: string, commentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/public/dubs/${projectId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })
  if (!response.ok) throw new Error('Yorum silinemedi.')
}

// ═══════════════════════════ ADMIN API ═══════════════════════════

export interface ContentReport {
  id: string
  project_id: string
  reporter_user_id: string | null
  reason: string
  details: string | null
  status: string
  created_at: string
}

export async function getAdminReports(): Promise<ContentReport[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/reports`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseResponse<ContentReport[]>(response)
}

export async function getAdminUsers(query = ''): Promise<User[]> {
  const params = new URLSearchParams()
  if (query.trim()) params.set('q', query.trim())
  const suffix = params.size ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE_URL}/api/admin/users${suffix}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseResponse<User[]>(response)
}

export async function updateUserMembership(
  userId: string,
  tier: 'free' | 'vip',
  durationDays = 30,
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/membership`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tier, duration_days: durationDays }),
  })
  return parseResponse<User>(response)
}

export async function updateReportStatus(reportId: string, status: string): Promise<ContentReport> {
  const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}?status=${status}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  return parseResponse<ContentReport>(response)
}

export async function updateProjectModeration(projectId: string, moderation_status: string): Promise<DubbingProject> {
  const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/moderation?moderation_status=${moderation_status}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  return parseResponse<DubbingProject>(response)
}

export interface AdminOpsMetrics {
  app_status: string;
  database_connected: boolean;
  redis_configured: boolean;
  redis_connected: boolean;
  redis_error: string | null;
  media_root_exists: boolean;
  media_root_writable: boolean;
  ffmpeg_available: boolean;
  ffprobe_available: boolean;
  lipsync_enabled: boolean;
  lipsync_provider: string;
  shopier_enabled: boolean;

  total_users: number;
  active_vip_users: number;
  total_projects: number;
  completed_exports: number;
  failed_exports: number;
  public_dubs_count: number;
  pending_payments: number;
  paid_payments: number;
  failed_payments: number;
  comments_count: number;
  reports_count: number;

  recent_failed_jobs: Array<{
    id: string;
    title: string;
    created_at: string | null;
    status: string;
  }>;
}

export interface AdminComment {
  id: string
  project_id: string
  user_id: string
  display_name: string
  body: string
  status: string
  created_at: string
}

export interface AdminAuditLog {
  id: string
  admin_user_id: string
  action: string
  target_type: string
  target_id: string
  details?: string | null
  created_at: string
}

export async function getAdminComments(): Promise<AdminComment[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/comments?comment_status=visible`, {
    headers: getAuthHeaders(),
  })
  return parseResponse<AdminComment[]>(response)
}

export async function hideAdminComment(commentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/comments/${commentId}/hide`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  })
  await parseResponse<{ message: string }>(response)
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
    headers: getAuthHeaders(),
  })
  return parseResponse<AdminAuditLog[]>(response)
}

export async function getAdminOpsMetrics(): Promise<AdminOpsMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/admin/ops/metrics`, {
    method: 'GET',
    headers: getAuthHeaders(),
  })
  return parseResponse<AdminOpsMetrics>(response)
}
