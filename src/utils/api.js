import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
})

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`)
}

export const tasksAPI = {
  getDaily: (projectId, date) => api.get(`/tasks/daily/${projectId}?date=${date}`),
  updateTask: (taskId, data) => api.put(`/tasks/${taskId}`, data),
  addTask: (data) => api.post('/tasks', data)
}

export const aiAPI = {
  generateDailyPlan: (projectId, date) => api.post('/ai/daily-plan', { project_id: projectId, date }),
  analyzeDocuments: (formData) => api.post('/ai/analyze-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDailyReport: (projectId, date) => api.post('/ai/daily-report', { project_id: projectId, date }),
  getOptimizations: (projectId) => api.post('/ai/optimizations', { project_id: projectId }),
  chat: (projectId, message) => api.post('/ai/chat', { project_id: projectId, message })
}

export const filesAPI = {
  upload: (projectId, formData) => api.post(`/files/upload/${projectId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByProject: (projectId) => api.get(`/files/${projectId}`)
}

export const reportsAPI = {
  getProgress: (projectId) => api.get(`/reports/progress/${projectId}`),
  getDaily: (projectId, date) => api.get(`/reports/daily/${projectId}?date=${date}`)
}

export default api
