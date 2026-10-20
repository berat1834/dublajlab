import { describe, expect, it, vi } from 'vitest'
import type { User } from '../types'
import { refreshMembershipUser } from './membershipAccess'

const freeUser: User = {
  id: 'user-1',
  email: 'free@example.test',
  display_name: 'Free User',
  role: 'user',
  membership_tier: 'free',
  membership_expires_at: null,
  has_active_vip: false,
  mfa_enabled: false,
}

const vipUser: User = {
  ...freeUser,
  membership_tier: 'vip',
  membership_expires_at: '2026-11-20T00:00:00Z',
  has_active_vip: true,
}

describe('refreshMembershipUser', () => {
  it('replaces stale free membership with the fresh VIP response', async () => {
    await expect(refreshMembershipUser(freeUser, async () => vipUser)).resolves.toBe(vipUser)
  })

  it('keeps the last known user during a temporary refresh failure', async () => {
    await expect(
      refreshMembershipUser(freeUser, async () => {
        throw new Error('offline')
      }),
    ).resolves.toBe(freeUser)
  })

  it('does not request membership without a signed-in user', async () => {
    const fetchUser = vi.fn(async () => vipUser)

    await expect(refreshMembershipUser(null, fetchUser)).resolves.toBeNull()
    expect(fetchUser).not.toHaveBeenCalled()
  })
})
