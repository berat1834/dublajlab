import type { Tab } from '../types'

const TAB_PATHS: Partial<Record<Tab, string>> = {
  play: '/',
  scenes: '/sahneler',
  dubs: '/dublajlar',
  daily: '/gunun-dublaji',
  login: '/giris',
  register: '/kayit',
  library: '/kutuphanem',
  admin: '/admin/moderasyon',
  admin_ops: '/admin/sistem',
  profile: '/profil',
  account: '/hesap',
  membership: '/uyelik',
}

export function pathForTab(tab: Tab, templateId?: string | null): string {
  if (tab === 'scene_detail' && templateId) return `/sahneler/${encodeURIComponent(templateId)}`
  return TAB_PATHS[tab] || '/'
}

export function routeFromPath(pathname: string): { tab: Tab; templateId: string | null } {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const sceneMatch = normalized.match(/^\/sahneler\/([^/]+)$/)
  if (sceneMatch) {
    return { tab: 'scene_detail', templateId: decodeURIComponent(sceneMatch[1]) }
  }
  const entry = Object.entries(TAB_PATHS).find(([, path]) => path === normalized)
  return { tab: (entry?.[0] as Tab | undefined) || 'play', templateId: null }
}
