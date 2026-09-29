import { describe, expect, it } from 'vitest'
import type { DemoPolicy } from '../types'
import { shouldShowLipSync } from './lipSync'

const policy = (lipsyncEnabled: boolean): DemoPolicy => ({
  enabled: true,
  max_file_size_mb: 20,
  max_video_duration_seconds: 30,
  max_recording_size_mb: 5,
  max_exports_per_ip_per_day: 5,
  media_ttl_hours: 24,
  files_are_temporary: true,
  lipsync_enabled: lipsyncEnabled,
})

describe('lip-sync feature visibility', () => {
  it('hides the toggle while the backend feature is disabled or unavailable', () => {
    expect(shouldShowLipSync(null)).toBe(false)
    expect(shouldShowLipSync(policy(false))).toBe(false)
  })

  it('shows the toggle only when the backend reports the feature available', () => {
    expect(shouldShowLipSync(policy(true))).toBe(true)
  })
})
