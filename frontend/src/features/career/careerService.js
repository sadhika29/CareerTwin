import axiosClient from '../../api/axiosClient'

export const demoCareer = {
  readiness_score: 72,
  weakest_area: 'dsa',
  next_action: 'Practice dynamic programming for 30 minutes',
  skill_gaps: ['Dynamic programming', 'System design', 'Docker'],
}

/** Get current career readiness state */
export async function getCareerState() {
  const { data } = await axiosClient.get('/career/readiness')
  return data
}

/** Run a full career analysis */
export async function analyzeCareer(payload) {
  const { data } = await axiosClient.post('/career/analyze', payload)
  return data
}

/** Get Digital Twin snapshot */
export async function getDigitalTwin() {
  const { data } = await axiosClient.get('/digital-twin')
  return data
}

/** Get readiness history for trend charts */
export async function getReadinessHistory() {
  const { data } = await axiosClient.get('/digital-twin/history')
  return data
}

/**
 * What-If planner — sends scores to AI and gets back:
 * recommended_area, estimated_score_after_improvement, current_score, reason, impact
 */
export async function getWhatIf(scores) {
  const { data } = await axiosClient.post('/career/what-if', { scores })
  // Normalise response for UI consumption
  return {
    recommended_area: data.recommended_area,
    current_score: data.current_score,
    estimated_score: data.estimated_score_after_improvement,
    estimated_impact: data.impact !== undefined ? `+${data.impact.toFixed(1)}%` : null,
    recommendation: data.reason,
    priority: data.priority,
    ...data,
  }
}

/** Recalculate digital twin scores */
export async function recalculateDigitalTwin() {
  const { data } = await axiosClient.post('/digital-twin/recalculate')
  return data
}
