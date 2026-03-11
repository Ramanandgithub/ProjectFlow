import React from 'react'
import StatusBadge from './StatusBadge'
import { formatDistanceToNow, format } from 'date-fns'

export default function ProjectDetailModal({ project, onClose, onApprove, onReject, isAdmin }) {
  if (!project) return null

  const fmt = (d) => {
    try { return format(new Date(d), 'MMM dd, yyyy HH:mm') } catch { return d }
  }

  const fmtAgo = (d) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }) } catch { return d }
  }

  const actionIcons = { submitted: 'bi-send', approved: 'bi-check-circle', rejected: 'bi-x-circle' }
  const actionColors = { submitted: 'var(--pf-accent)', approved: 'var(--pf-success)', rejected: 'var(--pf-danger)' }

  const canAct = isAdmin && (project.status === 'pending' || project.status === 'submitted')

  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div className="pf-modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="pf-modal-header">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <StatusBadge status={project.status} />
              <span className="text-muted-pf fs-xs">#{project.id}</span>
            </div>
            <h5 style={{ fontFamily: 'Syne', fontWeight: 700, lineHeight: 1.3 }}>{project.title}</h5>
          </div>
          <button className="pf-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>

        <div className="pf-modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Submitted by', value: project.submitterName, icon: 'bi-person' },
              { label: 'Email', value: project.submitterEmail, icon: 'bi-envelope' },
              { label: 'Submitted', value: fmt(project.submittedAt), icon: 'bi-calendar' },
              { label: 'Last updated', value: fmtAgo(project.updatedAt), icon: 'bi-clock' },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: 'var(--pf-surface-2)', borderRadius: 10, padding: '10px 14px' }}>
                <div className="text-muted-pf fs-xs" style={{ marginBottom: 3 }}>
                  <i className={`bi ${icon}`} style={{ marginRight: 5 }} />{label}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="pf-form-group">
            <label className="pf-label">Description</label>
            <div style={{ background: 'var(--pf-surface-2)', borderRadius: 10, padding: '14px', fontSize: 13.5, lineHeight: 1.7, color: 'var(--pf-text-dim)' }}>
              {project.description}
            </div>
          </div>

          {/* Rejection Reason */}
          {project.status === 'rejected' && project.rejectionReason && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--pf-danger)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
                <i className="bi bi-x-octagon" style={{ marginRight: 5 }} />Rejection Reason
              </div>
              <div style={{ fontSize: 13, color: 'var(--pf-text-dim)' }}>{project.rejectionReason}</div>
            </div>
          )}

          {/* Files */}
          {project.files?.length > 0 && (
            <div className="pf-form-group">
              <label className="pf-label">Attachments ({project.files.length})</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {project.files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--pf-surface-2)', borderRadius: 10, padding: '10px 14px' }}>
                    <i className="bi bi-paperclip" style={{ color: 'var(--pf-accent)' }} />
                    <span style={{ fontSize: 13, flex: 1 }}>{f.name}</span>
                    <span className="text-muted-pf fs-xs">{f.size}</span>
                    <button className="pf-btn pf-btn-ghost pf-btn-sm"><i className="bi bi-download" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          <div>
            <label className="pf-label">Status History</label>
            <div className="pf-timeline">
              {project.history.map((h, i) => (
                <div key={i} className="pf-timeline-item">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <i
                      className={`bi ${actionIcons[h.action] || 'bi-dot'}`}
                      style={{ color: actionColors[h.action] || 'var(--pf-text-muted)', marginTop: 1 }}
                    />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{h.action}</div>
                      <div className="text-muted-pf fs-xs">by {h.by} · {fmt(h.at)}</div>
                      {h.note && <div style={{ fontSize: 12, color: 'var(--pf-text-dim)', marginTop: 3, fontStyle: 'italic' }}>"{h.note}"</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {canAct && (
          <div className="pf-modal-footer">
            <button className="pf-btn pf-btn-ghost" onClick={onClose}>Close</button>
            <button className="pf-btn pf-btn-danger" onClick={() => { onClose(); onReject(project) }}>
              <i className="bi bi-x-circle" /> Reject
            </button>
            <button className="pf-btn pf-btn-success" onClick={() => { onApprove(project.id); onClose() }}>
              <i className="bi bi-check-circle" /> Approve
            </button>
          </div>
        )}
        {!canAct && (
          <div className="pf-modal-footer">
            <button className="pf-btn pf-btn-ghost" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}