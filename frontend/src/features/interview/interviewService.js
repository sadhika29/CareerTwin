import axiosClient from '../../api/axiosClient'

/** Start an AI-powered mock interview session */
export async function startInterview(payload) {
  const { data } = await axiosClient.post('/interview/start', payload)
  return data
}

/** Submit a single answer — AI evaluates and returns coaching feedback */
export async function submitAnswer(sessionId, payload) {
  const { data } = await axiosClient.post(`/interview/${sessionId}/answer`, payload)
  return data
}

/** Get final interview result / summary */
export async function getInterviewResult(sessionId) {
  const { data } = await axiosClient.get(`/interview/${sessionId}/result`)
  return data
}

/** Get past interview history */
export async function getInterviewHistory() {
  const { data } = await axiosClient.get('/interview/history')
  return data
}
