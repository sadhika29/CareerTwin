/**
 * Secure redirect management for CareerTwin authentication.
 * Ensures feature-specific "Get Started" destinations survive
 * login/signup while preventing open redirect vulnerabilities and loops.
 */

export const REDIRECT_STORAGE_KEY = 'career_redirect_after_login'

/**
 * Validates whether a candidate path is a safe, internal application destination.
 * Rejects external URLs, protocol-relative paths (//), schemes (javascript:, http:),
 * and self-referential auth routes.
 */
export function isValidRedirectPath(path) {
  if (!path || typeof path !== 'string') return false
  const trimmed = path.trim()

  // Must begin with a single slash
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return false

  // Reject URL schemes before query/hash (e.g. /javascript:, /https:)
  const pathWithoutQuery = trimmed.split('?')[0].split('#')[0]
  if (pathWithoutQuery.includes(':')) return false

  // Reject infinite redirect loops back to auth or home
  const normalized = pathWithoutQuery.toLowerCase()
  if (
    normalized === '' ||
    normalized === '/' ||
    normalized === '/login' ||
    normalized === '/signup' ||
    normalized === '/forgot-password'
  ) {
    return false
  }

  return true
}

function getStorage() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    return window.sessionStorage
  }
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage
  }
  return null
}

/**
 * Persists an intended destination across login and registration flows.
 */
export function saveRedirectPath(path) {
  const storage = getStorage()
  if (!storage) return
  if (isValidRedirectPath(path)) {
    try {
      storage.setItem(REDIRECT_STORAGE_KEY, path.trim())
    } catch {
      // Ignore sessionStorage errors (e.g. private browsing restrictions)
    }
  }
}

/**
 * Retrieves the validated destination after successful authentication.
 * Priority: 1. returnTo URL query param, 2. location.state?.from, 3. sessionStorage.
 * Clears the stored redirect once consumed.
 */
export function getRedirectDestination(location, searchParams) {
  const queryParam = searchParams?.get?.('returnTo')
  const stateParam = location?.state?.from
  let sessionParam = null

  const storage = getStorage()
  if (storage) {
    try {
      sessionParam = storage.getItem(REDIRECT_STORAGE_KEY)
    } catch {
      sessionParam = null
    }
  }

  const candidates = [queryParam, stateParam, sessionParam]

  for (const candidate of candidates) {
    if (isValidRedirectPath(candidate)) {
      clearRedirectPath()
      return candidate.trim()
    }
  }

  clearRedirectPath()
  return '/dashboard'
}

/**
 * Clears stale redirect destinations from sessionStorage.
 */
export function clearRedirectPath() {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(REDIRECT_STORAGE_KEY)
  } catch {
    // Ignore
  }
}

