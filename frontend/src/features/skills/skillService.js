import axiosClient from '../../api/axiosClient'
export async function getSkills() { const { data } = await axiosClient.get('/skills'); return data }
export async function analyzeSkills() { const { data } = await axiosClient.post('/skills/analyze'); return data }
export async function getSkillGaps() { const { data } = await axiosClient.get('/skills/gaps'); return data }
