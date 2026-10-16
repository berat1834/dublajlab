export const MIN_PASSWORD_LENGTH = 10

const COMMON_PASSWORDS = new Set([
  '1234567890',
  'admin123',
  'dublajlab',
  'dublajlab123',
  'letmein',
  'password',
  'password1',
  'password123',
  'qwerty',
  'qwerty123',
  'testpassword',
  'welcome',
])

export interface PasswordEvaluation {
  longEnough: boolean
  notCommon: boolean
  excludesIdentity: boolean
  isValid: boolean
  score: 0 | 1 | 2 | 3
}

function identityTerms(email: string, displayName: string): string[] {
  const emailLocal = email.split('@', 1)[0].toLowerCase()
  const nameParts = displayName.toLowerCase().split(/[\s_.-]+/)
  return [emailLocal, ...nameParts].filter((term) => term.length >= 4)
}

export function evaluatePassword(
  password: string,
  email = '',
  displayName = '',
): PasswordEvaluation {
  const normalized = password.toLowerCase().trim()
  const longEnough = password.length >= MIN_PASSWORD_LENGTH
  const notCommon = !COMMON_PASSWORDS.has(normalized)
  const excludesIdentity = !identityTerms(email, displayName).some((term) =>
    normalized.includes(term),
  )
  const isValid = longEnough && notCommon && excludesIdentity

  if (!password) {
    return {
      longEnough,
      notCommon: false,
      excludesIdentity: false,
      isValid,
      score: 0,
    }
  }

  const characterGroups = [
    /[a-zçğıöşü]/.test(password),
    /[A-ZÇĞİÖŞÜ]/.test(password),
    /\d/.test(password),
    /[^\p{L}\d]/u.test(password),
  ].filter(Boolean).length
  const rawScore =
    (longEnough ? 1 : 0) +
    (password.length >= 12 ? 1 : 0) +
    (password.length >= 16 || characterGroups >= 3 ? 1 : 0)

  const score = !notCommon || !excludesIdentity ? 1 : Math.min(3, rawScore)

  return {
    longEnough,
    notCommon,
    excludesIdentity,
    isValid,
    score: score as 0 | 1 | 2 | 3,
  }
}
