import axiosClient from '../../api/axiosClient'
export async function getJobs(params) { const { data } = await axiosClient.get('/jobs', { params }); return data }
export async function getJobById(id) { const { data } = await axiosClient.get(`/jobs/${id}`); return data }
export async function createJob(payload) { const { data } = await axiosClient.post('/jobs', payload); return data }
export async function analyzeJob(id) { const { data } = await axiosClient.post(`/jobs/${id}/analyze`); return data }
export async function getJobMatch(id) { const { data } = await axiosClient.get(`/jobs/${id}/match`); return data }
export async function matchJob(id, payload) { const { data } = await axiosClient.post(`/jobs/${id}/match`, payload); return data }
export async function analyzeJobAIFit(id, payload) { const { data } = await axiosClient.post(`/jobs/${id}/ai-fit`, payload); return data }
