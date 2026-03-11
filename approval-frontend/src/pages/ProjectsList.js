import React, { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectContext'
import StatusBadge from '../components/StatusBadge'
import RejectModel from '../components/RejectModel'
import ProjectDetailModel from '../components/ProjectDetailModel'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

export default function ProjectsList() {
  const { user, isAdmin } = useAuth()
  const { projects, approveProject, rejectProject, bulkApprove, bulkReject } = useProjects()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [submitterFilter, setSubmitterFilter] = useState('all')
  const [sortField, setSortField] = useState('submittedAt')
  const [sortDir, setSortDir] = useState('desc')
  const [selected, setSelected] = useState([])
  const [rejectTarget, setRejectTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false)

  const myProjects = isAdmin ? projects : projects.filter(p => p.submitterId === user?.id)
  const submitters = [...new Set(myProjects.map(p => p.submitterName))]

  const filtered = useMemo(() => {
    return myProjects
      .filter(p => {
        const q = search.toLowerCase()
        const matchSearch = !q || p.title.toLowerCase().includes(q) || p.submitterName.toLowerCase().includes(q)
        const matchStatus = statusFilter === 'all' || p.status === statusFilter
        const matchSubmitter = submitterFilter === 'all' || p.submitterName === submitterFilter
        return matchSearch && matchStatus && matchSubmitter
      })
      .sort((a, b) => {
        let av = a[sortField], bv = b[sortField]
        if (sortField === 'submittedAt' || sortField === 'updatedAt') { av = new Date(av); bv = new Date(bv) }
        if (av < bv) return sortDir === 'asc' ? -1 : 1
        if (av > bv) return sortDir === 'asc' ? 1 : -1
        return 0
      })
  }, [myProjects, search, statusFilter, submitterFilter, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <i className="bi bi-chevron-expand" style={{ fontSize: 10, marginLeft: 4, opacity: 0.4 }} />
    return <i className={`bi bi-chevron-${sortDir === 'asc' ? 'up' : 'down'}`} style={{ fontSize: 10, marginLeft: 4, color: 'var(--pf-accent)' }} />
  }

  const handleSelectAll = (e) => setSelected(e.target.checked ? filtered.map(p => p.id) : [])
  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleApprove = async (id) => {
    try {
      await approveProject(id, user.name)
      toast.success('Project approved! Submitter has been notified.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to approve project')
    }
  }

  const handleReject = (project) => setRejectTarget(project)
  const handleRejectConfirm = async (reason) => {
    try {
      await rejectProject(rejectTarget.id, reason, user.name)
      toast.info('Project rejected. Submitter has been notified.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject project')
    }
    setRejectTarget(null)
  }

  const handleBulkApprove = async () => {
    const ids = selected.filter(id => {
      const p = projects.find(x => x.id === id)
      return p?.status === 'pending' || p?.status === 'submitted'
    })
    try {
      await bulkApprove(ids, user.name)
      toast.success(`${ids.length} project(s) approved!`)
    } catch (err) {
      console.error(err)
      toast.error('Bulk approve failed')
    }
    setSelected([])
  }

  return (
    <div className="pf-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>{isAdmin ? 'All Projects' : 'My Projects'}</h1>
          <p className="text-muted-pf">{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="pf-card" style={{ marginBottom: 16 }}>
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <div className="pf-search-wrap">
              <i className="bi bi-search" />
              <input
                className="pf-input"
                placeholder="Search projects..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <select className="pf-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {isAdmin && (
            <div className="col-md-2">
              <select className="pf-select" value={submitterFilter} onChange={e => setSubmitterFilter(e.target.value)}>
                <option value="all">All Submitters</option>
                {submitters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="col-md-2">
            <button className="pf-btn pf-btn-ghost" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => { setSearch(''); setStatusFilter('all'); setSubmitterFilter('all') }}>
              <i className="bi bi-x-circle" /> Clear
            </button>
          </div>
          {isAdmin && selected.length > 0 && (
            <div className="col-md-12">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10 }}>
                <i className="bi bi-check2-square text-accent" />
                <span style={{ fontSize: 13 }}><strong>{selected.length}</strong> selected</span>
                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button className="pf-btn pf-btn-success pf-btn-sm" onClick={handleBulkApprove}>
                    <i className="bi bi-check-circle" /> Bulk Approve
                  </button>
                  <button className="pf-btn pf-btn-danger pf-btn-sm" onClick={() => setBulkRejectOpen(true)}>
                    <i className="bi bi-x-circle" /> Bulk Reject
                  </button>
                  <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => setSelected([])}>
                    Deselect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="pf-card" style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div className="pf-empty-state">
            <i className="bi bi-folder2-open" />
            <p>No projects match your filters</p>
          </div>
        ) : (
          <div className="pf-table-wrap" style={{ border: 'none', borderRadius: 'var(--pf-radius-lg)' }}>
            <table className="pf-table">
              <thead>
                <tr>
                  {isAdmin && (
                    <th style={{ width: 40 }}>
                      <input type="checkbox" className="pf-checkbox"
                        checked={filtered.length > 0 && selected.length === filtered.length}
                        onChange={handleSelectAll} />
                    </th>
                  )}
                  <th className="sortable" onClick={() => toggleSort('title')}>
                    Project <SortIcon field="title" />
                  </th>
                  {isAdmin && <th>Submitter</th>}
                  <th className="sortable" onClick={() => toggleSort('submittedAt')}>
                    Submitted <SortIcon field="submittedAt" />
                  </th>
                  <th className="sortable" onClick={() => toggleSort('status')}>
                    Status <SortIcon field="status" />
                  </th>
                  <th className="sortable" onClick={() => toggleSort('updatedAt')}>
                    Updated <SortIcon field="updatedAt" />
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    {isAdmin && (
                      <td>
                        <input type="checkbox" className="pf-checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelect(p.id)} />
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600, marginBottom: 3, maxWidth: 280, cursor: 'pointer' }}
                        onClick={() => setDetailTarget(p)}>
                        {p.title}
                      </div>
                      {p.files?.length > 0 && (
                        <div className="text-muted-pf fs-xs">
                          <i className="bi bi-paperclip" style={{ marginRight: 4 }} />
                          {p.files.length} file{p.files.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="pf-avatar pf-avatar-user" style={{ width: 28, height: 28, fontSize: 11 }}>
                            {p.submitterName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.submitterName}</div>
                            <div className="text-muted-pf fs-xs">{p.submitterEmail}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    <td className="text-muted-pf fs-sm">{format(new Date(p.submittedAt), 'MMM dd, yyyy')}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-muted-pf fs-xs">{format(new Date(p.updatedAt), 'MMM dd, HH:mm')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => setDetailTarget(p)} title="View details">
                          <i className="bi bi-eye" />
                        </button>
                        {isAdmin && (p.status === 'pending' || p.status === 'submitted') && (
                          <>
                            <button className="pf-btn pf-btn-success pf-btn-sm" onClick={() => handleApprove(p.id)} title="Approve">
                              <i className="bi bi-check-lg" />
                            </button>
                            <button className="pf-btn pf-btn-danger pf-btn-sm" onClick={() => handleReject(p)} title="Reject">
                              <i className="bi bi-x-lg" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {rejectTarget && (
        <RejectModel
          project={rejectTarget}
          onConfirm={handleRejectConfirm}
          onClose={() => setRejectTarget(null)}
        />
      )}

      {bulkRejectOpen && (
        <RejectModel
          project={{ title: `${selected.length} selected projects` }}
          onConfirm={(reason) => {
            const ids = selected.filter(id => {
              const p = projects.find(x => x.id === id)
              return p?.status === 'pending' || p?.status === 'submitted'
            })
            bulkReject(ids, reason, user.name)
            toast.info(`${ids.length} project(s) rejected.`)
            setSelected([])
            setBulkRejectOpen(false)
          }}
          onClose={() => setBulkRejectOpen(false)}
        />
      )}

      {detailTarget && (
        <ProjectDetailModel
          project={detailTarget}
          isAdmin={isAdmin}
          onClose={() => setDetailTarget(null)}
          onApprove={(id) => { handleApprove(id); setDetailTarget(null) }}
          onReject={(p) => { setDetailTarget(null); setRejectTarget(p) }}
        />
      )}
    </div>
  )
}