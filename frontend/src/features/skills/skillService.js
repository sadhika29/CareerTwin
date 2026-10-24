import axiosClient from '../../api/axiosClient'

export async function getSkills() {
  const { data } = await axiosClient.get('/skills')
  return data
}

export async function getSkillTaxonomy() {
  const { data } = await axiosClient.get('/skills/taxonomy')
  return data
}

export async function analyzeSkills(payload) {
  const { data } = await axiosClient.post('/skills/analyze', payload)
  return data
}

export async function getSkillGaps() {
  const { data } = await axiosClient.get('/skills/gaps')
  return data
}

// --------------------------------------------------------------------------
// User Skills Management API
// --------------------------------------------------------------------------

export async function getUserSkills() {
  const { data } = await axiosClient.get('/skills/user')
  return data
}

export async function createUserSkill(skillData) {
  const { data } = await axiosClient.post('/skills/user', skillData)
  return data
}

export async function updateUserSkill(skillId, skillData) {
  const { data } = await axiosClient.patch(`/skills/user/${skillId}`, skillData)
  return data
}

export async function deleteUserSkill(skillId) {
  const { data } = await axiosClient.delete(`/skills/user/${skillId}`)
  return data
}

export async function updateTargetRole(targetRole) {
  const { data } = await axiosClient.patch('/skills/user/target-role', { target_role: targetRole })
  return data
}

// --------------------------------------------------------------------------
// Learning & Practice Progress API
// --------------------------------------------------------------------------

export async function getLearningProgress(category = '') {
  const params = category ? { category } : {}
  const { data } = await axiosClient.get('/skills/learning/progress', { params })
  return data
}

export async function updateLearningProgress(progressData) {
  const { data } = await axiosClient.post('/skills/learning/progress', progressData)
  return data
}
