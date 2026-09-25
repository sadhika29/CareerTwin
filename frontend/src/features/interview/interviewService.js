import axiosClient from '../../api/axiosClient'
export async function startInterview(type) { const { data } = await axiosClient.post('/interview/start', { type }); return data }
export async function submitAnswer(id, answer) { const { data } = await axiosClient.post(`/interview/${id}/answer`, { answer }); return data }
export async function getInterviewResult(id) { const { data } = await axiosClient.get(`/interview/${id}/result`); return data }
export async function getInterviewHistory() { const { data } = await axiosClient.get('/interview/history'); return data }
