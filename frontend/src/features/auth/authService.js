import axiosClient from '../../api/axiosClient'

const SESSION_KEYS = ['career_user', 'career_access_token']

function persistSession(payload) {
  const data = payload?.data || payload
  const user = data?.user || data?.account || data
  const userId = data?.user_id || user?.id || user?.user_id
  if (!userId) throw new Error('The authentication response did not include a user id.')
  localStorage.setItem('career_user', String(userId))
  if (data?.access_token || data?.token) localStorage.setItem('career_access_token', data.access_token || data.token)
  return user
}

function apiError(error, fallback) {
  const message = error.response?.data?.detail || error.response?.data?.message || error.response?.data?.error?.message
  return new Error(message || fallback)
}

export async function signIn(credentials) { try { const { data } = await axiosClient.post('/auth/login', credentials); return persistSession(data) } catch (error) { throw apiError(error, 'Unable to sign in. Check your details and try again.') } }
export async function signUp(payload) { try { const { data } = await axiosClient.post('/auth/register', payload); return persistSession(data) } catch (error) { throw apiError(error, 'Unable to create your account right now.') } }
export async function requestPasswordReset(email) { try { await axiosClient.post('/auth/forgot-password', { email }); } catch (error) { throw apiError(error, 'Unable to send reset instructions right now.') } }
export async function signInWithGoogle() { try { const { data } = await axiosClient.post('/auth/google'); return persistSession(data) } catch (error) { throw apiError(error, 'Google authentication is not configured yet.') } }
export function signOut() { SESSION_KEYS.forEach(key => localStorage.removeItem(key)) }
