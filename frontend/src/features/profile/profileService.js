import axiosClient from '../../api/axiosClient'

/** Get active user profile and AI persona */
export async function getProfile() {
  const { data } = await axiosClient.get('/profile')
  return data
}

/** Update profile details */
export async function updateProfile(payload) {
  const { data } = await axiosClient.post('/profile', payload)
  return data
}

/** Run multi-agent AI career advisor */
export async function runAIProfileAdvisor(rawInput, profileData = {}) {
  const { data } = await axiosClient.post('/profile/ai-advisor', {
    raw_input: rawInput,
    target_role: profileData.target_role,
    education: profileData.education,
    interests: profileData.interests,
    current_skills: profileData.skills,
  })
  return data
}

/** Apply AI-recommended persona directly to active profile */
export async function applyAIPersona() {
  const { data } = await axiosClient.post('/profile/apply-ai-persona')
  return data
}
