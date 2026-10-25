import axiosClient from '../../api/axiosClient'
import { auth } from '../../firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'

const SESSION_KEYS = ['career_user', 'career_access_token', 'career_email', 'career_name']

function persistSession(payload) {
  const data = payload?.data || payload
  const user = data?.user || data?.account || data
  const userId = data?.user_id || user?.id || user?.user_id
  if (!userId) throw new Error('Authentication response did not include a valid user id.')
  
  localStorage.setItem('career_user', String(userId))
  if (data?.access_token || data?.token) {
    localStorage.setItem('career_access_token', data.access_token || data.token)
  }
  if (user?.email) localStorage.setItem('career_email', user.email)
  if (user?.full_name || user?.name) localStorage.setItem('career_name', user.full_name || user.name)
  return user
}

function parseApiError(error, fallback) {
  let message = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error?.message
  if (Array.isArray(message)) {
    message = message.map((m) => m.msg || m.message || JSON.stringify(m)).join(', ')
  }
  return typeof message === 'string' && message.trim() ? message.trim() : fallback
}

function translateFirebaseError(error, fallback = 'Authentication failed.') {
  const code = error?.code || ''
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please log in.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up first.'
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment or reset your password.'
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed before completing.'
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase Console. Using backend authentication.'
    default:
      return error?.message?.replace(/^Firebase:\s*/, '') || fallback
  }
}

export async function signUp(payload) {
  const email = (payload.email || '').trim().toLowerCase()
  const password = payload.password
  const fullName = (payload.full_name || `${payload.firstName || ''} ${payload.lastName || ''}`).trim()
  const username = (payload.username || email.split('@')[0] || `user_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_]/g, '')

  let firebaseUser = null
  let firebaseToken = null
  let firebaseErr = null

  // 1. Attempt Firebase Authentication
  if (auth && email && password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      firebaseUser = userCredential.user
      if (fullName) {
        await updateProfile(firebaseUser, { displayName: fullName }).catch(() => {})
      }
      firebaseToken = await firebaseUser.getIdToken()
    } catch (fbError) {
      firebaseErr = fbError
      console.warn('Firebase createUser warning:', fbError.code, fbError.message)
      if (fbError.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please log in.')
      }
      if (fbError.code === 'auth/weak-password') {
        throw new Error('Password must be at least 6 characters.')
      }
      if (fbError.code === 'auth/invalid-email') {
        throw new Error('Please enter a valid email address.')
      }
    }
  }

  // 2. Also register with FastAPI backend (so backend session is synchronized)
  let backendData = null
  let backendErr = null
  try {
    const { data } = await axiosClient.post('/auth/register', {
      full_name: fullName || username,
      username: username,
      email: email,
      password: password,
      confirm_password: payload.confirm_password || password,
    })
    backendData = data
  } catch (bErr) {
    backendErr = bErr
    console.warn('Backend /auth/register warning:', bErr.message)
    if (bErr.response?.status === 409) {
      throw new Error(parseApiError(bErr, 'An account with this email or username already exists. Please log in.'))
    }
  }

  // 3. If neither Firebase nor Backend succeeded, surface the error
  if (!firebaseUser && !backendData) {
    if (backendErr) {
      throw new Error(parseApiError(backendErr, 'Unable to create your account right now. Check your details and try again.'))
    }
    if (firebaseErr) {
      throw new Error(translateFirebaseError(firebaseErr, 'Unable to create your account right now.'))
    }
    throw new Error('Unable to create your account. Please try again.')
  }

  // 4. Persist user session
  const userId = firebaseUser?.uid || backendData?.user?.id || `user_${Date.now()}`
  const token = firebaseToken || backendData?.access_token || `token_${Date.now()}`

  localStorage.setItem('career_user', String(userId))
  localStorage.setItem('career_access_token', token)
  localStorage.setItem('career_email', email)
  if (fullName) localStorage.setItem('career_name', fullName)

  return {
    id: userId,
    email,
    full_name: fullName,
    access_token: token,
  }
}

export async function signIn(credentials) {
  const identifier = (credentials.identifier || '').trim()
  const password = credentials.password
  const isEmail = identifier.includes('@')

  let firebaseUser = null
  let firebaseToken = null

  // 1. If email, attempt Firebase Authentication
  if (isEmail && auth) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier.toLowerCase(), password)
      firebaseUser = userCredential.user
      firebaseToken = await firebaseUser.getIdToken()
    } catch (fbError) {
      console.warn('Firebase signIn notice:', fbError.code, fbError.message)
      if (fbError.code === 'auth/too-many-requests') {
        throw new Error('Too many failed login attempts. Please wait a few minutes or reset your password.')
      }
    }
  }

  // If Firebase sign-in succeeded
  if (firebaseUser) {
    const userId = firebaseUser.uid
    localStorage.setItem('career_user', String(userId))
    localStorage.setItem('career_access_token', firebaseToken)
    localStorage.setItem('career_email', firebaseUser.email || identifier)
    if (firebaseUser.displayName) localStorage.setItem('career_name', firebaseUser.displayName)

    // Sync with backend session non-blockingly
    axiosClient.post('/auth/login', { identifier, password }).catch(() => {})

    return {
      id: userId,
      email: firebaseUser.email,
      access_token: firebaseToken,
    }
  }

  // 2. Attempt backend authentication
  try {
    const { data } = await axiosClient.post('/auth/login', { identifier, password })
    return persistSession(data)
  } catch (backendError) {
    const msg = parseApiError(backendError, 'Unable to sign in. Check your details and try again.')
    throw new Error(msg)
  }
}

export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase authentication is not configured.')
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const token = await user.getIdToken()

    localStorage.setItem('career_user', String(user.uid))
    localStorage.setItem('career_access_token', token)
    if (user.email) localStorage.setItem('career_email', user.email)
    if (user.displayName) localStorage.setItem('career_name', user.displayName)

    // Sync with backend
    axiosClient.post('/auth/register', {
      full_name: user.displayName || 'Google User',
      username: (user.email ? user.email.split('@')[0] : `user_${Date.now()}`).toLowerCase().replace(/[^a-z0-9_]/g, ''),
      email: user.email || `${user.uid}@gmail.com`,
      password: `OAuth_${user.uid}_P@ss1`,
      confirm_password: `OAuth_${user.uid}_P@ss1`,
    }).catch(() => {})

    return user
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in was canceled.')
    }
    throw new Error(translateFirebaseError(error, 'Google authentication failed.'))
  }
}

export async function signInWithGithub() {
  if (!auth) throw new Error('Firebase authentication is not configured.')
  try {
    const provider = new GithubAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const token = await user.getIdToken()

    localStorage.setItem('career_user', String(user.uid))
    localStorage.setItem('career_access_token', token)
    if (user.email) localStorage.setItem('career_email', user.email)
    if (user.displayName) localStorage.setItem('career_name', user.displayName)

    return user
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('GitHub sign-in was canceled.')
    }
    throw new Error(translateFirebaseError(error, 'GitHub authentication failed.'))
  }
}

export async function requestPasswordReset(email) {
  const cleanEmail = (email || '').trim().toLowerCase()
  if (!cleanEmail) throw new Error('Enter a valid email address.')

  let sent = false
  if (auth) {
    try {
      await sendPasswordResetEmail(auth, cleanEmail)
      sent = true
    } catch (fbError) {
      console.warn('Firebase sendPasswordResetEmail notice:', fbError.code, fbError.message)
    }
  }

  try {
    await axiosClient.post('/auth/forgot-password', { email: cleanEmail })
    sent = true
  } catch (err) {}

  if (!sent) {
    throw new Error('Unable to send reset instructions right now. Please check your email address.')
  }
  return { success: true }
}

export function signOut() {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key))
  // Clear all user session items to ensure strict state isolation between accounts
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k && k.startsWith('career_') && k !== 'career_remember') {
      localStorage.removeItem(k)
    }
  }
  if (auth && auth.signOut) {
    auth.signOut().catch(() => {})
  }
}


