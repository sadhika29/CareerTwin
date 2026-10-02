import axiosClient from '../../api/axiosClient'

export async function uploadResume(file, userId) {
  const uid = userId || localStorage.getItem('career_user') || ''
  const formData = new FormData()
  formData.append('file', file)
  formData.append('user_id', uid)

  const { data } = await axiosClient.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function listResumes(userId) {
  const uid = userId || localStorage.getItem('career_user') || ''
  const { data } = await axiosClient.get(`/resumes?user_id=${uid}`)
  return data
}
export const getResumes = listResumes


export async function getResume(resumeId, userId) {
  const uid = userId || localStorage.getItem('career_user') || ''
  const { data } = await axiosClient.get(`/resumes/${resumeId}?user_id=${uid}`)
  return data
}

export async function analyzeResume(resumeId, payload = {}) {
  const uid = payload.user_id || localStorage.getItem('career_user') || ''
  const { data } = await axiosClient.post(`/resumes/${resumeId}/analyze`, {
    user_id: uid,
    target_role: payload.target_role || 'Software Engineer',
    target_job_id: payload.target_job_id,
  })
  return data
}

export async function getATSScore(resumeId, jobId) {
  const uid = localStorage.getItem('career_user') || ''
  const { data } = await axiosClient.post(`/resumes/${resumeId}/ats`, {
    user_id: uid,
    job_id: jobId,
  })
  return data
}
