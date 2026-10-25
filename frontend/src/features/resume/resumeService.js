import axiosClient from '../../api/axiosClient'
import { auth } from '../../firebase'

const getActiveUid = (explicitUid) => explicitUid || auth?.currentUser?.uid || localStorage.getItem('career_user') || ''

export async function uploadResume(file, userId) {
  const uid = getActiveUid(userId)
  const formData = new FormData()
  formData.append('file', file)
  if (uid) formData.append('user_id', uid)

  const { data } = await axiosClient.post('/resumes/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function listResumes(userId) {
  const uid = getActiveUid(userId)
  const url = uid ? `/resumes?user_id=${encodeURIComponent(uid)}` : '/resumes'
  const { data } = await axiosClient.get(url)
  return data
}
export const getResumes = listResumes

export async function getResume(resumeId, userId) {
  const uid = getActiveUid(userId)
  const url = uid ? `/resumes/${resumeId}?user_id=${encodeURIComponent(uid)}` : `/resumes/${resumeId}`
  const { data } = await axiosClient.get(url)
  return data
}

export async function analyzeResume(resumeId, payload = {}) {
  const uid = getActiveUid(payload.user_id)
  const { data } = await axiosClient.post(`/resumes/${resumeId}/analyze`, {
    user_id: uid,
    target_role: payload.target_role || 'Software Engineer',
    target_job_id: payload.target_job_id,
    job_description: payload.job_description || undefined,
  })
  return data
}

export async function getATSScore(resumeId, jobId) {
  const uid = getActiveUid()
  const { data } = await axiosClient.post(`/resumes/${resumeId}/ats`, {
    user_id: uid,
    job_id: jobId,
  })
  return data
}

export async function saveAnalysis(payload) {
  const uid = getActiveUid(payload.user_id)
  const { data } = await axiosClient.post('/resumes/analyses/save', {
    ...payload,
    user_id: uid,
  })
  return data
}

export async function listSavedAnalyses(userId) {
  const uid = getActiveUid(userId)
  const url = uid ? `/resumes/analyses?user_id=${encodeURIComponent(uid)}` : '/resumes/analyses'
  const { data } = await axiosClient.get(url)
  return data
}

export async function getSavedAnalysis(analysisId, userId) {
  const uid = getActiveUid(userId)
  const url = uid ? `/resumes/analyses/${analysisId}?user_id=${encodeURIComponent(uid)}` : `/resumes/analyses/${analysisId}`
  const { data } = await axiosClient.get(url)
  return data
}

export async function deleteSavedAnalysis(analysisId, userId) {
  const uid = getActiveUid(userId)
  const url = uid ? `/resumes/analyses/${analysisId}?user_id=${encodeURIComponent(uid)}` : `/resumes/analyses/${analysisId}`
  const { data } = await axiosClient.delete(url)
  return data
}

