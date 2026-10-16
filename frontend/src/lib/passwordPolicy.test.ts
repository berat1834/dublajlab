import { describe, expect, it } from 'vitest'
import { evaluatePassword } from './passwordPolicy'

describe('password policy', () => {
  it('accepts a sufficiently long passphrase without composition requirements', () => {
    const result = evaluatePassword('uzun ve sakin bir parola')

    expect(result.isValid).toBe(true)
    expect(result.score).toBe(3)
  })

  it('rejects short and common passwords', () => {
    expect(evaluatePassword('short123').longEnough).toBe(false)
    const common = evaluatePassword('Password123')
    expect(common.notCommon).toBe(false)
    expect(common.score).toBe(1)
  })

  it('rejects passwords containing email or display-name information', () => {
    const result = evaluatePassword(
      'berat-2026-guvenli',
      'berat@example.com',
      'Berat Baylan',
    )

    expect(result.excludesIdentity).toBe(false)
    expect(result.isValid).toBe(false)
  })
})
