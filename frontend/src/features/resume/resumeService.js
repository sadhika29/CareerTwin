import axiosClient from '../../api/axiosClient'
export async function uploadResume(file) { const body = new FormData(); body.append('file', file); const { data } = await axiosClient.post('/resume/upload', body); return data }
export async function getResume() { const { data } = await axiosClient.get('/resume'); return data }
export async function analyzeResume() { const { data } = await axiosClient.post('/resume/analyze'); return data }
export async function getATSScore() { const { data } = await axiosClient.get('/resume/ats-score'); return data }
