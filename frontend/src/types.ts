export type VoiceStyle =
  | 'announcer'
  | 'robot'
  | 'dramatic'
  | 'documentary'
  | 'energetic'

export interface UploadResponse {
  video_id: string
  original_filename: string
  duration_seconds: number
  size_bytes: number
  preview_url: string
}

export interface ProcessResponse {
  job_id: string
  status: 'completed'
  output_video_id: string
  download_url: string
}

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed'

export interface JobResponse {
  job_id: string
  status: JobStatus
  progress: number
  message: string
  output_video_id: string | null
  download_url: string | null
  error: string | null
}

export interface DemoPolicy {
  enabled: boolean
  max_file_size_mb: number
  max_video_duration_seconds: number
  max_recording_size_mb: number
  max_exports_per_ip_per_day: number
  media_ttl_hours: number
  files_are_temporary: boolean
}

export interface ApiErrorBody {
  detail?: string
  errors?: Array<{ field: string; message: string }>
}

export interface TimelineLine {
  id: string
  start: number
  end: number
  text: string
}

export interface VideoTemplate {
  id: string
  title: string
  category: string
  description: string
  duration_seconds: number
  video_url: string | null
  license: string
  source: string
  lines: TimelineLine[]
  play_count?: number
  character_count?: number
}

export type Tab = 'play' | 'scenes' | 'scene_detail' | 'dubs' | 'daily' | 'login' | 'register' | 'library' | 'admin' | 'oda_kur' | 'profile' | 'account' | 'membership' | 'user_scenes' | 'user_favorites' | 'user_credits'

export interface User {
  id: string
  email: string
  display_name: string
  avatar_url?: string | null
  role: string
  discord_linked?: boolean
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface DubbingExport {
  id: string
  project_id: string
  output_video_id: string
  download_url?: string
  duration_seconds?: string
  file_size_bytes?: string
  created_at: string
}

export interface DubbingProject {
  id: string
  user_id?: string
  source_type: string
  template_id?: string
  title: string
  duration_seconds?: string
  status: JobStatus | string
  visibility: string
  created_at: string
  updated_at: string
}
