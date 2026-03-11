import React from 'react'
import { useProjects } from '../context/ProjectContext'

const MOCK_USERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', initials: 'AJ', joined: '2024-01-10' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user', initials: 'BS', joined: '2024-02-01' },
  { id: 3, name: 'Carol White', email: 'carol@example.com', role: 'user', initials: 'CW', joined: '2024-03-15' },
]

export default function UserManagement() {
  const { projects } = useProjects()

  return (
    <div className="pf-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>User Management</h1>
        <p className="text-muted-pf">Manage system users and their roles.</p>
      </div>

      <div className="pf-card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--pf-border)', background: 'var(--pf-surface-2)', borderRadius: 'var(--pf-radius-lg) var(--pf-radius-lg) 0 0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="bi bi-people text-accent" />
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>Registered Users</span>
          <span className="text-muted-pf fs-xs" style={{ marginLeft: 'auto' }}>{MOCK_USERS.length} total</span>
        </div>
        <div className="pf-table-wrap" style={{ border: 'none', borderRadius: '0 0 var(--pf-radius-lg) var(--pf-radius-lg)' }}>
          <table className="pf-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Projects</th>
                <th>Approved</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(u => {
                const userProjects = projects.filter(p => p.submitterId === u.id)
                const approved = userProjects.filter(p => p.status === 'approved').length
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className={`pf-avatar ${u.role === 'admin' ? 'pf-avatar-admin' : 'pf-avatar-user'}`} style={{ width: 34, height: 34, fontSize: 12 }}>
                          {u.initials}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="text-muted-pf fs-sm">{u.email}</td>
                    <td>
                      <span className={`pf-badge ${u.role === 'admin' ? '' : 'pf-badge-submitted'}`}
                        style={u.role === 'admin' ? { background: 'rgba(139,92,246,0.12)', color: '#a78bfa' } : {}}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{userProjects.length}</td>
                    <td>
                      <span style={{ color: 'var(--pf-success)', fontWeight: 600 }}>{approved}</span>
                      {userProjects.length > 0 && (
                        <span className="text-muted-pf fs-xs"> ({Math.round((approved / userProjects.length) * 100)}%)</span>
                      )}
                    </td>
                    <td className="text-muted-pf fs-sm">{u.joined}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}