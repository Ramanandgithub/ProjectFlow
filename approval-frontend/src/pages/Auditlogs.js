import React, { useState } from 'react'
import { useProjects } from '../context/ProjectContext'
import { format } from 'date-fns'

export default function AuditLogs() {
  const { projects } = useProjects()
  const [filter, setFilter] = useState('all')

  const allLogs = projects.flatMap(p =>
    p.history.map(h => ({
      ...h,
      projectId: p.id,
      projectTitle: p.title,
      submitter: p.submitterName,
    }))
  ).sort((a, b) => new Date(b.at) - new Date(a.at))

  const filtered = filter === 'all' ? allLogs : allLogs.filter(l => l.action === filter)

  const actionStyles = {
    submitted: { icon: 'bi-send', color: 'var(--pf-accent)', bg: 'rgba(59,130,246,0.1)' },
    approved: { icon: 'bi-check-circle', color: 'var(--pf-success)', bg: 'rgba(16,185,129,0.1)' },
    rejected: { icon: 'bi-x-circle', color: 'var(--pf-danger)', bg: 'rgba(239,68,68,0.1)' },
  }

  return (
    <div className="pf-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>Audit Logs</h1>
          <p className="text-muted-pf">Complete history of all project workflow actions.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'submitted', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              className={`pf-btn pf-btn-ghost pf-btn-sm ${filter === f ? 'active' : ''}`}
              style={filter === f ? { background: 'rgba(59,130,246,0.12)', color: 'var(--pf-accent)', borderColor: 'rgba(59,130,246,0.3)' } : {}}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="pf-card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--pf-border)', background: 'var(--pf-surface-2)', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 'var(--pf-radius-lg) var(--pf-radius-lg) 0 0' }}>
          <i className="bi bi-clock-history text-accent" />
          <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>Activity Log</span>
          <span className="text-muted-pf fs-xs" style={{ marginLeft: 'auto' }}>{filtered.length} entries</span>
        </div>

        {filtered.length === 0 ? (
          <div className="pf-empty-state">
            <i className="bi bi-clock-history" />
            <p>No audit logs found</p>
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {filtered.map((log, i) => {
              const style = actionStyles[log.action] || actionStyles.submitted
              return (
                <div key={i} style={{
                  display: 'flex',
                  gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--pf-border)' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <div style={{
                    width: 36, height: 36,
                    borderRadius: 10,
                    background: style.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 16,
                    color: style.color
                  }}>
                    <i className={`bi ${style.icon}`} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize', color: style.color }}>{log.action}</span>
                        <span style={{ fontSize: 13, color: 'var(--pf-text-dim)', marginLeft: 6 }}>
                          by <strong>{log.by}</strong>
                        </span>
                      </div>
                      <span className="text-muted-pf fs-xs" style={{ flexShrink: 0 }}>{format(new Date(log.at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    <div style={{ fontSize: 13, marginBottom: log.note ? 4 : 0 }}>
                      Project: <span style={{ color: 'var(--pf-accent)', fontWeight: 500 }}>#{log.projectId} {log.projectTitle}</span>
                    </div>
                    {log.note && (
                      <div style={{ fontSize: 12, color: 'var(--pf-text-muted)', fontStyle: 'italic', background: 'var(--pf-surface-2)', padding: '6px 10px', borderRadius: 8, marginTop: 4 }}>
                        "{log.note}"
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}