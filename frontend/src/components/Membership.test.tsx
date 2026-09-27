import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { Membership } from './Membership'
import type { User } from '../types'


const baseUser: User = {
  id: 'user-1',
  email: 'user@dublajlab.com',
  display_name: 'Test User',
  role: 'user',
  membership_tier: 'free',
  membership_expires_at: null,
  has_active_vip: false,
}


describe('Membership', () => {
  it('shows the VIP purchase action to a free member', () => {
    const markup = renderToStaticMarkup(
      createElement(Membership, {
        currentUser: baseUser,
        setCurrentUser: vi.fn(),
        setActiveTab: vi.fn(),
        onToast: vi.fn(),
      }),
    )

    expect(markup).toContain('VIP üyelik al')
    expect(markup).toContain('Ücretsiz')
    expect(markup).toContain('720p')
  })

  it('shows active state instead of checkout to a VIP member', () => {
    const markup = renderToStaticMarkup(
      createElement(Membership, {
        currentUser: {
          ...baseUser,
          membership_tier: 'vip',
          membership_expires_at: '2026-12-31T00:00:00Z',
          has_active_vip: true,
        },
        setCurrentUser: vi.fn(),
        setActiveTab: vi.fn(),
        onToast: vi.fn(),
      }),
    )

    expect(markup).toContain('VIP üyeliğin aktif')
    expect(markup).not.toContain('VIP üyelik al</button>')
  })
})
