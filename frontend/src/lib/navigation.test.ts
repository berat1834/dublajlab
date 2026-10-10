import { describe, expect, it } from 'vitest'
import { pathForTab, routeFromPath } from './navigation'

describe('navigation mapping', () => {
  it('maps stable product paths to tabs', () => {
    expect(routeFromPath('/uyelik')).toEqual({ tab: 'membership', templateId: null })
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
