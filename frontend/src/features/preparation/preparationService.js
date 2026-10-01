import axiosClient from '../../api/axiosClient'

/** Fetch AI-generated today's tasks personalised to the user's context */
export async function getTodayTasks(context = {}) {
  const { data } = await axiosClient.post('/preparation/today', context)
  return data
}

/** Fetch today tasks via GET (minimal context) */
export async function getTodayTasksSimple(targetRole = 'Software Engineer', availableTime = 60) {
  const { data } = await axiosClient.get('/preparation/today', {
    params: { target_role: targetRole, available_time: availableTime },
  })
  return data
}

/** Generate a full AI preparation plan */
export async function createPreparationPlan(payload) {
  const { data } = await axiosClient.post('/preparation/plan', payload)
  return data
}

/** Get AI analysis of weak topics */
export async function getWeakTopics(context = {}) {
  if (Object.keys(context).length === 0) {
    const { data } = await axiosClient.get('/preparation/weak-topics')
    return data
  }
  const { data } = await axiosClient.post('/preparation/weak-topics', context)
  return data
}

/** Get preparation progress */
export async function getPreparationProgress() {
  const { data } = await axiosClient.get('/preparation/progress')
  return data
}

/** AI-generated assessment questions */
export async function createAssessment(payload) {
  const { data } = await axiosClient.post('/preparation/assessment', payload)
  return data
}

/** Submit assessment answers for AI evaluation */
export async function submitAssessment(payload) {
  const { data } = await axiosClient.post('/preparation/assessment/submit', payload)
  return data
}

/** AI reattempt for failed/skipped questions */
export async function reattemptIncomplete(payload) {
  const { data } = await axiosClient.post('/preparation/assessment/reattempt-incomplete', payload)
  return data
}

/** Get AI performance analysis */
export async function analyzePerformance(context = {}) {
  const { data } = await axiosClient.post('/preparation/performance/analyze', context)
  return data
}

/** Get AI recommendation for what to study next */
export async function getRecommendation(context = {}) {
  const { data } = await axiosClient.post('/preparation/recommendation', context)
  return data
}
