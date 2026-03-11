import React from 'react'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectContext'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { format, subDays } from 'date-fns'
import StatusBadge from '../components/StatusBadge'

const COLORS = {
  approved: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444',
  submitted: '#3b82f6',
}

export default function Dashboard({ setPage }) {
  const { user, isAdmin } = useAuth()
  const { projects, getStats, stats } = useProjects()
  
  // Handle both local and server stats formats
  const statsToUse = (() => {
    let baseStats
    if (stats && (stats.total || stats.total?.count)) {
      // Server format: {total: {count, percent}, approved: {count, percent}, ...}
      baseStats = {
        total: stats.total?.count || 0,
        approved: stats.approved?.count || 0,
        rejected: stats.rejected?.count || 0,
        pending: stats.pending?.count || 0,
        submitted: stats.submitted?.count || 0,
      }
    } else {
      // Local format: {total: number, approved: number, ...}
      baseStats = stats || getStats(user?.id, isAdmin)
    }
    
    // Ensure pct function exists
    if (!baseStats.pct) {
      const total = baseStats.total || 0
      baseStats.pct = (v) => total ? Math.round((v / total) * 100) : 0
    }
    return baseStats
  })()

  const myProjects = isAdmin ? projects : projects.filter(p => p.submitterId === user?.id)
  const recent = [...myProjects].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5)

  const pieData = [
    { name: 'Approved', value: statsToUse.approved },
    { name: 'Pending', value: statsToUse.pending },
    { name: 'Rejected', value: statsToUse.rejected },
    { name: 'Submitted', value: statsToUse.submitted },
  ].filter(d => d.value > 0)

  // Bar chart: last 7 days submissions
  const barData = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(new Date(), 6 - i)
    const dateStr = format(day, 'yyyy-MM-dd')
    const count = myProjects.filter(p => p.submittedAt.startsWith(dateStr)).length
    return { day: format(day, 'MMM dd'), count }
  })

  const statCards = [
    { key: 'total', label: 'Total Projects', value: statsToUse.total, icon: 'bi-folder2', color: 'blue', pct: '100%', desc: 'All time' },
    { key: 'pending', label: 'Pending Review', value: statsToUse.pending + statsToUse.submitted, icon: 'bi-hourglass-split', color: 'yellow', pct: `${statsToUse.pct(statsToUse.pending + statsToUse.submitted)}%`, desc: 'Awaiting action' },
    { key: 'approved', label: 'Approved', value: statsToUse.approved, icon: 'bi-check-circle', color: 'green', pct: `${statsToUse.pct(statsToUse.approved)}%`, desc: 'Of total' },
    { key: 'rejected', label: 'Rejected', value: statsToUse.rejected, icon: 'bi-x-circle', color: 'red', pct: `${statsToUse.pct(statsToUse.rejected)}%`, desc: 'Of total' },
  ]

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{payload[0].payload.day}</div>
          <div style={{ color: 'var(--pf-accent)' }}>{payload[0].value} project{payload[0].value !== 1 ? 's' : ''}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="pf-page">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span style={{ color: 'var(--pf-accent)' }}>{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-muted-pf">
          {isAdmin ? "Here's an overview of all projects in the workflow." : "Here's a summary of your submitted projects."}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {statCards.map(s => (
          <div key={s.key} className="col-xl-3 col-md-6">
            <div className={`pf-stat-card ${s.color}`}>
              <div className={`pf-stat-icon ${s.color}`}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div className="pf-stat-value">{s.value}</div>
              <div className="pf-stat-label">{s.label}</div>
              <div className="pf-stat-percent">{s.pct} · {s.desc}</div>
              <div className="pf-progress" style={{ marginTop: 12 }}>
                <div
                  className={`pf-progress-bar ${s.color}`}
                  style={{ width: s.pct }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-xl-8">
          <div className="pf-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h6 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 0 }}>Submissions — Last 7 Days</h6>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barSize={28}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--pf-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.06)' }} />
                <Bar dataKey="count" fill="var(--pf-accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="pf-card" style={{ height: '100%' }}>
            <h6 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20 }}>Status Breakdown</h6>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={COLORS[entry.name.toLowerCase()] || '#64748b'} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--pf-surface-2)', border: '1px solid var(--pf-border)', borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: 'var(--pf-text)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 8 }}>
                  {pieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[d.name.toLowerCase()] }} />
                      <span className="text-muted-pf">{d.name}</span>
                      <span style={{ fontWeight: 700 }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="pf-empty-state" style={{ padding: '30px 0' }}>
                <i className="bi bi-pie-chart" />
                <p>No data yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="pf-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h6 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 0 }}>Recent Projects</h6>
          <button className="pf-btn pf-btn-ghost pf-btn-sm" onClick={() => setPage('projects')}>
            View All <i className="bi bi-arrow-right" />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="pf-empty-state">
            <i className="bi bi-folder2-open" />
            <p>No projects yet</p>
            <button className="pf-btn pf-btn-primary" style={{ marginTop: 12 }} onClick={() => setPage('submit')}>
              <i className="bi bi-plus" /> Submit First Project
            </button>
          </div>
        ) : (
          <div className="pf-table-wrap">
            <table className="pf-table">
              <thead>
                <tr>
                  <th>Project</th>
                  {isAdmin && <th>Submitter</th>}
                  <th>Date</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, marginBottom: 2, maxWidth: 260 }}>{p.title}</div>
                      <div className="text-muted-pf fs-xs">{p.files?.length || 0} file{p.files?.length !== 1 ? 's' : ''}</div>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="pf-avatar pf-avatar-user" style={{ width: 26, height: 26, fontSize: 10 }}>
                            {p.submitterName?.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <span style={{ fontSize: 13 }}>{p.submitterName}</span>
                        </div>
                      </td>
                    )}
                    <td className="text-muted-pf fs-sm">{format(new Date(p.submittedAt), 'MMM dd, yyyy')}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="text-muted-pf fs-xs">{format(new Date(p.updatedAt), 'MMM dd HH:mm')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}