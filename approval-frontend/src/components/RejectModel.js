import React, { useState } from 'react'

export default function RejectModal({ project, onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!reason.trim()) { setError('Rejection reason is required.'); return }
    onConfirm(reason.trim())
  }

  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div className="pf-modal" onClick={e => e.stopPropagation()}>
        <div className="pf-modal-header">
          <div>
            <h5 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 4 }}>
              <i className="bi bi-x-circle text-danger-pf" style={{ marginRight: 8 }} />
              Reject Project
            </h5>
            <p className="text-muted-pf fs-sm" style={{ marginBottom: 0 }}>
              "{project?.title}"
            </p>
          </div>
          <button className="pf-modal-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="pf-modal-body">
          <div className="pf-form-group">
            <label className="pf-label">Rejection Reason <span className="text-danger-pf">*</span></label>
            <textarea
              className={`pf-textarea ${error ? 'is-invalid' : ''}`}
              placeholder="Explain why this project is being rejected..."
              value={reason}
              onChange={e => { setReason(e.target.value); setError('') }}
              rows={4}
            />
            {error && <div className="pf-error-msg">{error}</div>}
          </div>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'var(--pf-danger)' }}>
            <i className="bi bi-info-circle" style={{ marginRight: 6 }} />
            The submitter will be notified via email with this rejection reason.
          </div>
        </div>
        <div className="pf-modal-footer">
          <button className="pf-btn pf-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="pf-btn pf-btn-danger" onClick={handleSubmit}>
            <i className="bi bi-x-circle" /> Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  )
}