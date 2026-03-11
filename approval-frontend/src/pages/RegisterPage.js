import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email format'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (!form.confirm) e.confirm = 'Please confirm your password'
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
        password_confirmation: form.confirm,
      }
      await register(payload)
      toast.success('Account created! Welcome to ProjectFlow.')
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      setErrors({ general: msg })
    } finally { setLoading(false) }
  }

  const upd = (field, val) => { setForm({ ...form, [field]: val }); setErrors({ ...errors, [field]: '' }) }

  const strength = () => {
    if (!form.password) return 0
    let s = 0
    if (form.password.length >= 8) s++
    if (/[A-Z]/.test(form.password)) s++
    if (/[0-9]/.test(form.password)) s++
    if (/[^A-Za-z0-9]/.test(form.password)) s++
    return s
  }

  const pw = strength()
  const pwColors = ['var(--pf-danger)', 'var(--pf-warning)', 'var(--pf-warning)', 'var(--pf-success)']
  const pwLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="pf-auth-wrap">
      <div className="pf-auth-left" style={{ width: 480 }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div className="pf-logo-icon">⚡</div>
            <div className="pf-logo-text">Project<span>Flow</span></div>
          </div>
          <h2 style={{ fontSize: 28, marginBottom: 8 }}>Create account</h2>
          <p className="text-muted-pf">Join ProjectFlow to start submitting projects.</p>
        </div>

        {errors.general && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', color: 'var(--pf-danger)', fontSize: 13, marginBottom: 20 }}>
            <i className="bi bi-exclamation-circle" style={{ marginRight: 8 }} />{errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="pf-form-group">
            <label className="pf-label">Full Name</label>
            <input className={`pf-input ${errors.name ? 'is-invalid' : ''}`} placeholder="John Doe"
              value={form.name} onChange={e => upd('name', e.target.value)} />
            {errors.name && <div className="pf-error-msg">{errors.name}</div>}
          </div>

          <div className="pf-form-group">
            <label className="pf-label">Email Address</label>
            <input className={`pf-input ${errors.email ? 'is-invalid' : ''}`} type="email" placeholder="you@example.com"
              value={form.email} onChange={e => upd('email', e.target.value)} />
            {errors.email && <div className="pf-error-msg">{errors.email}</div>}
          </div>

          <div className="pf-form-group">
            <label className="pf-label">Password</label>
            <input className={`pf-input ${errors.password ? 'is-invalid' : ''}`} type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e => upd('password', e.target.value)} />
            {form.password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 4, background: i <= pw ? pwColors[pw - 1] : 'var(--pf-surface-3)', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: pw > 0 ? pwColors[pw - 1] : 'transparent' }}>{pwLabels[pw]}</div>
              </div>
            )}
            {errors.password && <div className="pf-error-msg">{errors.password}</div>}
          </div>

          <div className="pf-form-group">
            <label className="pf-label">Confirm Password</label>
            <input className={`pf-input ${errors.confirm ? 'is-invalid' : ''}`} type="password" placeholder="Repeat password"
              value={form.confirm} onChange={e => upd('confirm', e.target.value)} />
            {errors.confirm && <div className="pf-error-msg">{errors.confirm}</div>}
          </div>

          <button type="submit" className="pf-btn pf-btn-primary pf-btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <><span className="pf-spinner" style={{ marginRight: 8 }} />Creating account...</> : 'Create Account'}
          </button>
        </form>

        <div className="pf-divider" />

        <p className="text-muted-pf fs-sm" style={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <button style={{ background: 'none', border: 'none', color: 'var(--pf-accent)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/')}>
            Sign in
          </button>
        </p>
      </div>

      <div className="pf-auth-right">
        <div className="pf-auth-grid" />
        <div className="pf-auth-bg-pattern" />
        <div style={{ position: 'relative', textAlign: 'center', padding: 40, maxWidth: 400 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[
              { icon: '📁', title: 'Submit Projects', desc: 'Upload files and project details' },
              { icon: '🔔', title: 'Get Notified', desc: 'Email alerts on every status change' },
              { icon: '📊', title: 'Track Progress', desc: 'Dashboard with real-time stats' },
              { icon: '🔒', title: 'Secure Access', desc: 'Role-based permissions system' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--pf-surface)', border: '1px solid var(--pf-border)', borderRadius: 14, padding: '18px 16px', textAlign: 'left' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--pf-text-muted)' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}