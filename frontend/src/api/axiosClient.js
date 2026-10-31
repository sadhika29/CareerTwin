import axios from 'axios'
import { auth } from '../firebase'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

let authReadyPromise = null

/**
 * Returns a Promise that resolves when Firebase Auth finishes its initial state resolution.
 * Prevents requests from firing before Firebase hydrates currentUser from IndexedDB/localStorage.
 */
export function waitForAuthReady() {
  if (auth?.currentUser) {
    return Promise.resolve(auth.currentUser)
  }

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      // 1. If SDK supports authStateReady()
      if (typeof auth?.authStateReady === 'function') {
        auth
          .authStateReady()
          .then(() => resolve(auth?.currentUser || null))
          .catch(() => resolve(null))
      } else if (typeof auth?.onAuthStateChanged === 'function') {
        // 2. Standard onAuthStateChanged fallback
        const unsubscribe = auth.onAuthStateChanged(
          (user) => {
            unsubscribe()
            resolve(user)
          },
          () => resolve(null)
        )
      } else {
        resolve(null)
      }

      // Safety timeout: never hang request pipeline indefinitely
      setTimeout(() => {
        resolve(auth?.currentUser || null)
      }, 2500)
    })
  }

  return authReadyPromise
}

// Request interceptor: attaches fresh, verified Firebase Bearer token
axiosClient.interceptors.request.use(async (config) => {
  try {
    // Ensure Firebase auth state has resolved
    if (!auth?.currentUser) {
      await waitForAuthReady()
    }

    let token = null
    if (auth?.currentUser) {
      try {
        // Retrieve valid ID token without forcing unnecessary refresh
        token = await auth.currentUser.getIdToken(false)
        if (token) {
          localStorage.setItem('career_access_token', token)
          localStorage.setItem('career_user', auth.currentUser.uid)
        }
      } catch (err) {
        console.warn('getIdToken warning:', err?.message)
      }
    }

    // Fallback to locally persisted token
    if (!token) {
      token = localStorage.getItem('career_access_token')
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const userId = auth?.currentUser?.uid || localStorage.getItem('career_user')
    if (userId) {
      config.headers['X-User-ID'] = userId
    }
  } catch (err) {
    console.warn('Axios request auth interceptor error:', err)
  }

  return config
})

// Response interceptor: handles 401 token expiration and retries at most once
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (!originalRequest) {
      return Promise.reject(error)
    }

    const status = error.response?.status
    const is401 = status === 401

    // Retry recoverable auth errors at most once if authenticated user is present
    if (is401 && !originalRequest._retry && auth?.currentUser) {
      originalRequest._retry = true
      try {
        // Force refresh ID token from Firebase
        const freshToken = await auth.currentUser.getIdToken(true)
        if (freshToken) {
          localStorage.setItem('career_access_token', freshToken)
          localStorage.setItem('career_user', auth.currentUser.uid)
          originalRequest.headers.Authorization = `Bearer ${freshToken}`
          originalRequest.headers['X-User-ID'] = auth.currentUser.uid
          return axiosClient(originalRequest)
        }
      } catch (refreshErr) {
        console.warn('Axios 401 token refresh retry failed:', refreshErr)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosClient
