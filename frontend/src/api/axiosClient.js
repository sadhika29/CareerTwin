import axios from 'axios'
import { auth } from '../firebase'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use(async (config) => {
  let token = null
  if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken()
      if (token) {
        localStorage.setItem('career_access_token', token)
        localStorage.setItem('career_user', auth.currentUser.uid)
      }
    } catch {
      // fallback to stored token
    }
  }

  if (!token) {
    token = localStorage.getItem('career_access_token')
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  const user = auth?.currentUser?.uid || localStorage.getItem('career_user')
  if (user) {
    config.headers['X-User-ID'] = user
  }
  return config
})

export default axiosClient

