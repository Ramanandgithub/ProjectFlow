import axios from 'axios'

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  headers: { 'Accept': 'application/json' },
})

// Attach Bearer token from localStorage on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api

// ─── Auth endpoints ───────────────────────────────────────────────────────────
export const authApi = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  logout:   ()      => api.post('/auth/logout'),
  me:       ()      => api.get('/auth/me'),
  users:    ()      => api.get('/users'),
}

// ─── Project endpoints ────────────────────────────────────────────────────────
export const projectsApi = {
  list:       (params) => api.get('/projects', { params }),
  stats:      ()       => api.get('/projects/stats'),
  get:        (id)     => api.get(`/projects/${id}`),
  create:     (data)   => api.post('/projects', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  approve:    (id, data) => api.patch(`/projects/${id}/approve`, data),
  reject:     (id, data) => api.patch(`/projects/${id}/reject`, data),
  bulkAction: (data)     => api.post('/projects/bulk-action', data),
  delete:     (id)       => api.delete(`/projects/${id}`),
  auditLogs:  (params)   => api.get('/projects/audit-logs', { params }),
}