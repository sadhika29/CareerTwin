import axiosClient from '../../api/axiosClient'
export async function getSkills() { const { data } = await axiosClient.get('/skills'); return data }
export async function getSkillTaxonomy() { const { data } = await axiosClient.get('/skills/taxonomy'); return data }
export async function analyzeSkills(payload) { const { data } = await axiosClient.post('/skills/analyze', payload); return data }
export async function getSkillGaps() { const { data } = await axiosClient.get('/skills/gaps'); return data }

