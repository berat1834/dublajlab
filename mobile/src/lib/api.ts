import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';

import type {
  EngagementProgress,
  JobResponse,
  PublicDub,
  TimelineLine,
  UploadResponse,
  User,
  VideoTemplate,
} from '@/types';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.dublajlab.com.tr'
).replace(/\/$/, '');

export const WEB_BASE_URL = (
  process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://www.dublajlab.com.tr'
).replace(/\/$/, '');

type ApiErrorBody = { detail?: string };

async function request<T>(path: string, init: RequestInit = {}, token?: string | null) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (response.ok) return response.json() as Promise<T>;

  let message = 'İstek tamamlanamadı.';
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.detail) message = body.detail;
  } catch {
    if (response.status >= 500) message = 'Sunucu şu anda yanıt veremiyor.';
  }
  throw new Error(message);
}

async function parseResponse<T>(response: Response) {
  if (response.ok) return response.json() as Promise<T>;
  let message = 'İstek tamamlanamadı.';
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.detail) message = body.detail;
  } catch {
    if (response.status >= 500) message = 'Sunucu şu anda yanıt veremiyor.';
  }
  throw new Error(message);
}

function authHeaders(token?: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export function absoluteApiUrl(path: string) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function templateMediaUrl(path: string) {
  return /^https?:\/\//i.test(path)
    ? path
    : `${WEB_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function uploadTemplateVideo(template: VideoTemplate, token?: string | null) {
  if (!template.video_url) throw new Error('Bu sahnenin video dosyası bulunamadı.');
  const extension = template.video_url.split(/[?#]/)[0].match(/\.(mp4|mov|webm)$/i)?.[0] ?? '.mp4';
  const destination = new File(Paths.cache, `${template.id}${extension}`);
  const file = await File.downloadFileAsync(
    templateMediaUrl(template.video_url),
    destination,
    { idempotent: true },
  );
  const formData = new FormData();
  formData.append('file', file);
  const response = await expoFetch(`${API_BASE_URL}/api/video/upload`, {
    method: 'POST',
    headers: authHeaders(token),
    body: formData,
  });
  return parseResponse<UploadResponse>(response);
}

async function submitRecordings(payload: {
  videoId: string;
  templateId: string;
  timeline: TimelineLine[];
  recordings: Record<string, string>;
  token?: string | null;
}) {
  const ids = payload.timeline.map((line) => line.id);
  const formData = new FormData();
  formData.append('video_id', payload.videoId);
  formData.append('template_id', payload.templateId);
  formData.append('timeline', JSON.stringify(payload.timeline));
  formData.append('recording_ids', JSON.stringify(ids));
  formData.append('mute_original_audio', 'true');
  formData.append('burn_subtitles', 'true');
  formData.append('apply_lip_sync', 'false');
  for (const id of ids) {
    const uri = payload.recordings[id];
    if (!uri) throw new Error('Export için her repliği kaydedin.');
    formData.append('recordings', new File(uri));
  }
  const response = await expoFetch(`${API_BASE_URL}/api/jobs/dubbing-recordings`, {
    method: 'POST',
    headers: authHeaders(payload.token),
    body: formData,
  });
  return parseResponse<JobResponse>(response);
}

export const api = {
  templates: () => request<VideoTemplate[]>('/api/templates'),
  template: (id: string) =>
    request<VideoTemplate>(`/api/templates/${encodeURIComponent(id)}`),
  publicDubs: (token?: string | null) =>
    request<PublicDub[]>('/api/public/dubs', {}, token),
  me: (token: string) => request<User>('/api/auth/me', {}, token),
  engagement: (token: string) =>
    request<EngagementProgress>('/api/me/engagement', {}, token),
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>('/api/auth/mobile/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }),
  uploadTemplateVideo,
  submitRecordings,
  job: (id: string) => request<JobResponse>(`/api/jobs/${encodeURIComponent(id)}`),
};
