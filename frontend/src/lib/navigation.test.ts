import { describe, expect, it } from 'vitest'
import { pathForTab, routeFromPath } from './navigation'

describe('navigation mapping', () => {
  it('maps stable product paths to tabs', () => {
    expect(routeFromPath('/uyelik')).toEqual({ tab: 'membership', templateId: null })
    expect(routeFromPath('/sifremi-unuttum')).toEqual({ tab: 'forgot_password', templateId: null })
    expect(routeFromPath('/parola-sifirla')).toEqual({ tab: 'reset_password', templateId: null })
    expect(pathForTab('forgot_password')).toBe('/sifremi-unuttum')
    expect(pathForTab('reset_password')).toBe('/parola-sifirla')
    expect(pathForTab('admin_ops')).toBe('/admin/sistem')
  })

  it('preserves a scene id in a shareable path', () => {
    expect(pathForTab('scene_detail', 'comedy-reaction')).toBe('/sahneler/comedy-reaction')
    expect(routeFromPath('/sahneler/comedy-reaction')).toEqual({
      tab: 'scene_detail',
      templateId: 'comedy-reaction',
    })
  })
})
