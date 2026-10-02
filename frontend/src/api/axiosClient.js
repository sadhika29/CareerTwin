import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
})

axiosClient.interceptors.request.use((config) => {
  const user = localStorage.getItem('career_user')
  if (user) {
    config.headers['X-User-ID'] = user
  }
  const token = localStorage.getItem('career_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default axiosClient
