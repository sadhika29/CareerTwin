import axiosClient from '../../api/axiosClient'

/** Get all tracked applications and aggregate metrics */
export async function getApplications() {
  const { data } = await axiosClient.get('/applications')
  return data
}

/** Add a new application */
export async function createApplication(payload) {
  const { data } = await axiosClient.post('/applications', payload)
  return data
}

/** Update status, notes, or interview details */
export async function updateApplication(appId, payload) {
  const { data } = await axiosClient.patch(`/applications/${appId}`, payload)
  return data
}

/** Delete application */
export async function deleteApplication(appId) {
  const { data } = await axiosClient.delete(`/applications/${appId}`)
  return data
}

/** Generate company-tailored AI application strategy & coaching */
export async function getAIApplicationStrategy(appId, details = {}) {
  const { data } = await axiosClient.post(`/applications/${appId}/ai-strategy`, details)
  return data
}
