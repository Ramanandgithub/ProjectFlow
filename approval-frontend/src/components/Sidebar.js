import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectContext'

export default function Sidebar({ page, setPage }) {
  const { user, logout, isAdmin } = useAuth()
  const { projects } = useProjects()

  const pendingCount = projects.filter(p => p.status === 'pending' || p.status === 'submitted').length
  const myProjects = projects.filter(p => p.submitterId === user?.id).length

  const adminNav = [
    { id: 'dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
    { id: 'projects', icon: 'bi-folder2-open', label: 'All Projects', badge: pendingCount > 0 ? pendingCount : null, badgeType: 'warning' },
    { id: 'submit', icon: 'bi-plus-circle', label: 'New Project' },
    { id: 'audit', icon: 'bi-clock-history', label: 'Audit Logs' },
  ]

  const userNav = [
    { id: 'dashboard', icon: 'bi-grid-1x2', label: 'Dashboard' },
    { id: 'projects', icon: 'bi-folder2-open', label: 'My Projects', badge: myProjects || null },
    { id: 'submit', icon: 'bi-plus-circle', label: 'Submit Project' },
  ]

  const navItems = isAdmin ? adminNav : userNav

  return (
    <aside className="pf-sidebar">
      <div className="pf-sidebar-logo">
        <div className="pf-logo-icon">⚡</div>
        <div className="pf-logo-text">Project<span>Flow</span></div>
      </div>

      <nav className="pf-nav">
        <div className="pf-nav-section">Main Menu</div>
        {navItems.map(item => (
          <button
            key={item.id}
            className={`pf-nav-link ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <i className={`bi ${item.icon}`} />
            {item.label}
            {item.badge && (
              <span className={`pf-nav-badge ${item.badgeType || ''}`}>{item.badge}</span>
            )}
          </button>
        ))}

        {isAdmin && (
          <>
            <div className="pf-nav-section" style={{ marginTop: 16 }}>Administration</div>
            <button
              className={`pf-nav-link ${page === 'users' ? 'active' : ''}`}
              onClick={() => setPage('users')}
            >
              <i className="bi bi-people" />
              User Management
            </button>
          </>
        )}
      </nav>

      <div className="pf-sidebar-footer">
        <div className="pf-user-card" onClick={() => setPage('profile')}>
          <div className={`pf-avatar ${isAdmin ? 'pf-avatar-admin' : 'pf-avatar-user'}`}>
            {user?.initials || user?.name?.slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--pf-text-muted)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
          <i className="bi bi-three-dots-vertical" style={{ color: 'var(--pf-text-muted)', fontSize: 14 }} />
        </div>
        <button className="pf-nav-link" style={{ marginTop: 6, color: 'var(--pf-danger)' }} onClick={logout}>
          <i className="bi bi-box-arrow-left" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}