import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
import type { DubComment, DubbingExport, DubbingProject, EngagementProgress, JobResponse, MembershipPlan, PublicDub, TimelineLine, UploadResponse, User, VideoTemplate, VoiceStyle } from '@/types';

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.dublajlab.com.tr').replace(/\/$/, '');
export const WEB_BASE_URL = (process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://www.dublajlab.com.tr').replace(/\/$/, '');
export const MOBILE_OAUTH_CALLBACK = 'dublajlab://oauth-callback';
type ApiErrorBody = { detail?: string; errors?: { message: string }[] };
const REQUEST_TIMEOUT_MS = 20_000;

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
  let message = response.status >= 500 ? 'Sunucu şu anda yanıt veremiyor.' : 'İstek tamamlanamadı.';
  try {
    const body = (await response.json()) as ApiErrorBody;
    message = body.detail || body.errors?.[0]?.message || message;
  } catch { /* Durum koduna göre oluşturulan mesaj korunur. */ }
  throw new Error(message);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await parseResponse<T>(await fetch(`${API_BASE_URL}${path}`, { ...init, headers, signal: controller.signal }));
  } catch (reason) {
    if (reason instanceof Error && reason.name === 'AbortError') throw new Error('İstek zaman aşımına uğradı. İnternet bağlantını kontrol edip tekrar dene.');
    if (reason instanceof Error && !['Failed to fetch', 'Network request failed'].includes(reason.message)) throw reason;
    throw new Error('Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.');
  } finally { clearTimeout(timeout); }
}

function json(body: unknown): RequestInit { return { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }; }
function authHeaders(token?: string | null) { return token ? { Authorization: `Bearer ${token}` } : undefined; }
export function absoluteApiUrl(path: string) { return /^https?:\/\//i.test(path) ? path : `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`; }
export function templateMediaUrl(path: string) { return /^https?:\/\//i.test(path) ? path : `${WEB_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`; }
export function voicePreviewUrl(style: VoiceStyle) { return `${API_BASE_URL}/api/video/voice-preview/${encodeURIComponent(style)}`; }

async function uploadFile(uri: string, _name: string, _mimeType: string, token?: string | null) {
  const formData = new FormData();
  formData.append('file', new File(uri));
  const response = await expoFetch(`${API_BASE_URL}/api/video/upload`, { method: 'POST', headers: authHeaders(token), body: formData });
  return parseResponse<UploadResponse>(response as unknown as Response);
}

async function uploadTemplateVideo(template: VideoTemplate, token?: string | null) {
  if (!template.video_url) throw new Error('Bu sahnenin video dosyası bulunamadı.');
  const extension = template.video_url.split(/[?#]/)[0].match(/\.(mp4|mov|webm)$/i)?.[0] ?? '.mp4';
  const destination = new File(Paths.cache, `${template.id}${extension}`);
  const file = await File.downloadFileAsync(templateMediaUrl(template.video_url), destination, { idempotent: true });
  return uploadFile(file.uri, `${template.id}${extension}`, 'video/mp4', token);
}

export type ExportOptions = { muteOriginalAudio: boolean; burnSubtitles: boolean; applyLipSync: boolean };
async function submitRecordings(payload: { videoId: string; templateId?: string | null; timeline: TimelineLine[]; recordings: Record<string, string>; token?: string | null; options: ExportOptions }) {
  const ids = payload.timeline.map((line) => line.id);
  const formData = new FormData();
  formData.append('video_id', payload.videoId);
  if (payload.templateId) formData.append('template_id', payload.templateId);
  formData.append('timeline', JSON.stringify(payload.timeline));
  formData.append('recording_ids', JSON.stringify(ids));
  formData.append('mute_original_audio', String(payload.options.muteOriginalAudio));
  formData.append('burn_subtitles', String(payload.options.burnSubtitles));
  formData.append('apply_lip_sync', String(payload.options.applyLipSync));
  for (const id of ids) {
    const uri = payload.recordings[id];
    if (!uri) throw new Error('Export için her repliği kaydetmelisin.');
    formData.append('recordings', new File(uri));
  }
  const response = await expoFetch(`${API_BASE_URL}/api/jobs/dubbing-recordings`, { method: 'POST', headers: authHeaders(payload.token), body: formData });
  return parseResponse<JobResponse>(response as unknown as Response);
}

async function submitAi(payload: { videoId: string; templateId?: string | null; text: string; voiceStyle: VoiceStyle; token: string; options: ExportOptions }) {
  return request<JobResponse>('/api/jobs/dubbing-ai', { method: 'POST', ...json({ video_id: payload.videoId, template_id: payload.templateId || null, text: payload.text, voice_style: payload.voiceStyle, mute_original_audio: payload.options.muteOriginalAudio, burn_subtitles: payload.options.burnSubtitles, apply_lip_sync: payload.options.applyLipSync }) }, payload.token);
}

export const api = {
  templates: () => request<VideoTemplate[]>('/api/templates'),
  template: (id: string) => request<VideoTemplate>(`/api/templates/${encodeURIComponent(id)}`),
  publicDubs: (token?: string | null) => request<PublicDub[]>('/api/public/dubs', {}, token),
  publicDub: (id: string, token?: string | null) => request<PublicDub>(`/api/public/dubs/${id}`, {}, token),
  publicDubComments: (id: string, token?: string | null) => request<DubComment[]>(`/api/public/dubs/${id}/comments`, {}, token),
  addComment: (id: string, body: string, token: string) => request<DubComment>(`/api/public/dubs/${id}/comments`, { method: 'POST', ...json({ body }) }, token),
  deleteComment: (projectId: string, commentId: string, token: string) => request<void>(`/api/public/dubs/${projectId}/comments/${commentId}`, { method: 'DELETE' }, token),
  likeDub: (id: string, liking: boolean, token: string) => request<void>(`/api/public/dubs/${id}/like`, { method: liking ? 'POST' : 'DELETE' }, token),
  viewDub: (id: string) => request<void>(`/api/public/dubs/${id}/view`, { method: 'POST' }),
  reportDub: (id: string, reason: string, details?: string, token?: string | null) => request<void>(`/api/public/dubs/${id}/report`, { method: 'POST', ...json({ reason, details }) }, token),
  me: (token: string) => request<User>('/api/auth/me', {}, token),
  engagement: (token: string) => request<EngagementProgress>('/api/me/engagement', {}, token),
  projects: (token: string) => request<DubbingProject[]>('/api/me/projects', {}, token),
  exports: (token: string) => request<DubbingExport[]>('/api/me/exports', {}, token),
  updateProject: (id: string, update: { title?: string; visibility?: 'private' | 'public' }, token: string) => request<DubbingProject>(`/api/me/projects/${id}`, { method: 'PATCH', ...json(update) }, token),
  deleteProject: (id: string, token: string) => request<void>(`/api/me/projects/${id}`, { method: 'DELETE' }, token),
  updateProfile: (displayName: string, avatarUrl: string | null, token: string) => request<User>('/api/me/profile', { method: 'PATCH', ...json({ display_name: displayName, avatar_url: avatarUrl }) }, token),
  register: (email: string, password: string, displayName: string) => request<User>('/api/auth/register', { method: 'POST', ...json({ email, password, display_name: displayName }) }),
  resendVerification: (email: string) => request<{ message: string }>('/api/auth/resend-verification', { method: 'POST', ...json({ email }) }),
  login: (email: string, password: string) => request<{ access_token: string; token_type: string }>('/api/auth/mobile/login', { method: 'POST', ...json({ email, password }) }),
  forgotPassword: (email: string) => request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', ...json({ email, language: 'TR' }) }),
  membershipPlans: () => request<MembershipPlan[]>('/api/membership/plans'),
  checkout: (token: string) => request<{ checkout_url: string }>('/api/payments/checkout?plan=monthly', { method: 'POST' }, token),
  oauthLoginUrl: (provider: 'google' | 'discord') => `${API_BASE_URL}/api/auth/${provider}/login?return_to=${encodeURIComponent(MOBILE_OAUTH_CALLBACK)}`,
  uploadFile, uploadTemplateVideo, submitRecordings, submitAi,
  job: (id: string) => request<JobResponse>(`/api/jobs/${encodeURIComponent(id)}`),
};
