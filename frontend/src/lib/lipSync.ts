import type { DemoPolicy } from '../types'

export function shouldShowLipSync(policy: DemoPolicy | null): boolean {
  return policy?.lipsync_enabled === true
}
