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
}
