import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  // const handleSubmit = async (e) => {
  //   e.preventDefault()
  //   const errs = validate()
  //   if (Object.keys(errs).length) { setErrors(errs); return }
  //   setLoading(true)
  //   try {
  //     await new Promise(r => setTimeout(r, 600))
  //     login(form.email, form.password)
  //     toast.success('Welcome back!')
  //   } catch (err) {
  //     setErrors({ general: err.message })
  //   } finally { setLoading(false) }
  // }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back!')
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0]
                ?? err.response?.data?.message
                ?? 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const demoLogin = (email, password) => {
    setForm({ email, password })
  }

  return (
    <div className="pf-auth-wrap">
      <div className="pf-auth-left">
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="pf-logo-icon">⚡</div>
            <div className="pf-logo-text">Project<span>Flow</span></div>
          </div>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Welcome back</h2>
          <p className="text-muted-pf">Sign in to manage your project approvals.</p>
        </div>

        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', color: 'var(--pf-danger)', fontSize: 13, marginBottom: 20 }}>
            <i className="bi bi-exclamation-circle" style={{ marginRight: 8 }} />
            {errors.general}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(e) }}>
          <div className="pf-form-group">
            <label className="pf-label">Email Address</label>
            <input
              className={`pf-input ${errors.email ? 'is-invalid' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: '' }) }}
            />
            {errors.email && <div className="pf-error-msg">{errors.email}</div>}
          </div>

          <div className="pf-form-group">
            <label className="pf-label">Password</label>
            <input
              className={`pf-input ${errors.password ? 'is-invalid' : ''}`}
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: '' }) }}
            />
            {errors.password && <div className="pf-error-msg">{errors.password}</div>}
          </div>

          <button type="submit" className="pf-btn pf-btn-primary pf-btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="pf-spinner" style={{ marginRight: 8 }} />Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="pf-divider" />

        <div style={{ marginBottom: 16 }}>
          <div className="text-muted-pf fs-xs" style={{ marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Quick Demo Access</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="pf-btn pf-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
              onClick={() => demoLogin('alice@example.com', 'admin123')}>
              <i className="bi bi-shield-check" /> Admin
            </button>
            <button className="pf-btn pf-btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
              onClick={() => demoLogin('bob@example.com', 'user123')}>
              <i className="bi bi-person" /> User
            </button>
          </div>
        </div>

        <p className="text-muted-pf fs-sm" style={{ textAlign: 'center' }}>
          Don't have an account?{' '}
          <button style={{ background: 'none', border: 'none', color: 'var(--pf-accent)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/register')}>
            Register here
          </button>
        </p>
      </div>

      <div className="pf-auth-right">
        <div className="pf-auth-grid" />
        <div className="pf-auth-bg-pattern" />
        <div style={{ position: 'relative', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 72, marginBottom: 20, filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.4))' }}>⚡</div>
          <h2 style={{ fontSize: 32, marginBottom: 12, fontFamily: 'Syne' }}>Streamline Your<br /><span style={{ color: 'var(--pf-accent)' }}>Approval Workflow</span></h2>
          <p className="text-muted-pf" style={{ maxWidth: 300, margin: '0 auto' }}>
            Submit, track, and manage projects with full role-based access control and real-time notifications.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32 }}>
            {[['bi-send', 'Submit'], ['bi-clock-history', 'Track'], ['bi-check2-circle', 'Approve']].map(([icon, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: 20, color: 'var(--pf-accent)' }}>
                  <i className={`bi ${icon}`} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--pf-text-muted)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}