import axiosClient from '../../api/axiosClient'

export const demoCareer = { readiness_score: 72, weakest_area: 'dsa', next_action: 'Practice dynamic programming for 30 minutes', skill_gaps: ['Dynamic programming', 'System design', 'Docker'] }
export async function getCareerState() { const { data } = await axiosClient.get('/career/readiness'); return data }
export async function analyzeCareer(payload) { const { data } = await axiosClient.post('/career/analyze', payload); return data }
export async function getDigitalTwin() { const { data } = await axiosClient.get('/digital-twin'); return data }
export async function getReadinessHistory() { const { data } = await axiosClient.get('/digital-twin/history'); return data }
export async function getWhatIf(scores) { const { data } = await axiosClient.post('/career/what-if', { scores }); return data }
