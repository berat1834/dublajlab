import type { User } from '../types'

export async function refreshMembershipUser(
  currentUser: User | null,
  fetchUser: () => Promise<User>,
): Promise<User | null> {
  if (!currentUser) return null

  try {
    return await fetchUser()
  } catch {
    // A temporary network problem must not sign out an otherwise valid session.
    // Protected backend endpoints still enforce the authoritative VIP state.
    return currentUser
  }
}
