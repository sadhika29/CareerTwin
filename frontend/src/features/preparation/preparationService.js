import axiosClient from '../../api/axiosClient'
export async function getPreparationPlan() { const { data } = await axiosClient.get('/preparation/plan'); return data }
export async function getTodayTasks() { const { data } = await axiosClient.get('/preparation/today'); return data }
export async function getPreparationProgress() { const { data } = await axiosClient.get('/preparation/progress'); return data }
export async function getWeakTopics() { const { data } = await axiosClient.get('/preparation/weak-topics'); return data }
