import React, { createContext, useContext, useState, useEffect } from 'react'
import { projectsApi } from '../api'

const ProjectContext = createContext(null)
export const useProjects = () => useContext(ProjectContext)

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([])
  const [stats, setStats] = useState({ total: 0, approved: 0, rejected: 0, pending: 0, submitted: 0 })

  // fetch list + stats from server
  const fetchProjects = async () => {
    try {
      const { data } = await projectsApi.list()
      // Transform API response format to frontend format
      const normalized = (data.data || []).map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        files: p.files || [],
        submittedAt: p.submitted_at,
        updatedAt: p.updated_at,
        createdAt: p.created_at,
        // Flatten user info
        submitterId: p.user?.id,
        submitterName: p.user?.name,
        submitterEmail: p.user?.email,
        // Keep original for reference
        user: p.user,
        // Approvals & audit logs if present
        approvals: p.approvals || [],
        auditLogs: p.audit_logs || [],
        latestApproval: p.latest_approval,
        history: p.approvals?.map(a => ({
          action: a.decision === 'approved' ? 'approved' : 'rejected',
          by: a.admin?.name,
          at: a.decided_at,
          note: a.reason || '',
        })) || [],
        rejectionReason: p.latest_approval?.reason || '',
      }))
      setProjects(normalized)
    } catch (err) {
      console.error('could not load projects', err)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await projectsApi.stats()
      setStats(data.data || stats)
    } catch (err) {
      console.error('could not load stats', err)
    }
  }

  useEffect(() => {
    fetchProjects()
    fetchStats()
  }, [])


  const addProject = async (data, user, config = {}) => {
    // allow both plain object and FormData
    let payload
    if (data instanceof FormData) {
      payload = data
    } else {
      payload = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'files' && Array.isArray(v)) {
          v.forEach(file => payload.append('files[]', file))
        } else {
          payload.append(k, v)
        }
      })
    }

    try {
      const { data: res } = await projectsApi.create(payload, config)
      setProjects(prev => [res.data, ...prev])
      await fetchStats()
      return res.data
    } catch (err) {
      console.error('addProject api error', err)
      throw err
    }
  }

  const approveProject = async (id, adminName) => {
    try {
      await projectsApi.approve(id, { adminName })
      setProjects(prev => prev.map(p => p.id === id ? {
        ...p,
        status: 'approved',
        updatedAt: new Date().toISOString(),
        history: [...(p.history || []), { action: 'approved', by: adminName, at: new Date().toISOString(), note: '' }]
      } : p))
      await fetchStats()
    } catch (err) {
      console.error('approveProject api error', err)
      throw err
    }
  }

  const rejectProject = async (id, reason, adminName) => {
    try {
      await projectsApi.reject(id, { reason })
      setProjects(prev => prev.map(p => p.id === id ? {
        ...p,
        status: 'rejected',
        updatedAt: new Date().toISOString(),
        rejectionReason: reason,
        history: [...(p.history || []), { action: 'rejected', by: adminName, at: new Date().toISOString(), note: reason }]
      } : p))
      await fetchStats()
    } catch (err) {
      console.error('rejectProject api error', err)
      throw err
    }
  }

  const bulkApprove = async (ids, adminName) => {
    try {
      await projectsApi.bulkAction({ action: 'approve', ids, adminName })
      await fetchProjects()
      await fetchStats()
    } catch (err) {
      console.error('bulkApprove api error', err)
      throw err
    }
  }

  const bulkReject = async (ids, reason, adminName) => {
    try {
      await projectsApi.bulkAction({ action: 'reject', ids, reason, adminName })
      await fetchProjects()
      await fetchStats()
    } catch (err) {
      console.error('bulkReject api error', err)
      throw err
    }
  }

  const getStats = (userId, isAdmin) => {
    if (stats && stats.total) {
      // server-provided numbers already include permissions filter
      return stats
    }
    const relevant = isAdmin ? projects : projects.filter(p => p.submitterId === userId)
    const total = relevant.length
    const approved = relevant.filter(p => p.status === 'approved').length
    const rejected = relevant.filter(p => p.status === 'rejected').length
    const pending = relevant.filter(p => p.status === 'pending').length
    const submitted = relevant.filter(p => p.status === 'submitted').length
    const pct = v => total ? Math.round((v / total) * 100) : 0
    return { total, approved, rejected, pending, submitted, pct }
  }

  return (
    <ProjectContext.Provider value={{ projects, stats, refresh: fetchProjects, addProject, approveProject, rejectProject, bulkApprove, bulkReject, getStats }}>
      {children}
    </ProjectContext.Provider>
  )
}