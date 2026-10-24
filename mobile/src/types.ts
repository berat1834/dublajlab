export type TimelineLine = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type VideoTemplate = {
  id: string;
  title: string;
  category: string;
  description: string;
  duration_seconds: number;
  video_url: string | null;
  license: string;
  source: string;
  is_demo?: boolean;
  lines: TimelineLine[];
  play_count?: number;
  character_count?: number;
};

export type PublicDub = {
  project_id: string;
  title: string;
  display_name: string;
  created_at: string;
  duration_seconds?: string | null;
  download_url?: string | null;
  view_count: number;
  like_count: number;
  liked_by_me: boolean;
};

export type User = {
  id: string;
  email: string;
  display_name: string;
  role: string;
  membership_tier: 'free' | 'vip';
  has_active_vip: boolean;
  email_verified: boolean;
};

export type DailyTask = {
  key: string;
  progress: number;
  target: number;
  xp: number;
  completed: boolean;
};

export type EngagementProgress = {
  current_streak: number;
  longest_streak: number;
  today_xp: number;
  tasks: DailyTask[];
};

export type UploadResponse = {
  video_id: string;
  original_filename: string;
  duration_seconds: number;
  size_bytes: number;
  preview_url: string;
};

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type JobResponse = {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  output_video_id: string | null;
  download_url: string | null;
  error: string | null;
};
