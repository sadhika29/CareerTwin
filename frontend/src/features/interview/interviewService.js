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

/** Restore a user-owned interview session after navigation or refresh. */
export async function getInterviewSession(sessionId) {
  const { data } = await axiosClient.get(`/interview/${sessionId}/session`)
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

/** Get Speechify AI voices available for VeriBot */
export async function getInterviewVoices() {
  const { data } = await axiosClient.get('/interview/voices')
  return data
}

/** Synthesize speech using Speechify AI and return blob object URL */
export async function fetchSpeechifyAudio(text, voiceId = 'dominic_32') {
  const response = await axiosClient.post(
    '/interview/tts',
    { text, voice_id: voiceId },
    { responseType: 'blob' }
  )
  return URL.createObjectURL(response.data)
}
