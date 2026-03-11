import React from 'react'

const STATUS_MAP = {
  pending:   { cls: 'pf-badge-pending',   label: 'Pending' },
  approved:  { cls: 'pf-badge-approved',  label: 'Approved' },
  rejected:  { cls: 'pf-badge-rejected',  label: 'Rejected' },
  submitted: { cls: 'pf-badge-submitted', label: 'Submitted' },
}

export default function StatusBadge({ status }) {
  const { cls, label } = STATUS_MAP[status] || { cls: 'pf-badge-submitted', label: status }
  return <span className={`pf-badge ${cls}`}>{label}</span>
}