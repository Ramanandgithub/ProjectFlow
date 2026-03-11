import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProjects } from '../context/ProjectContext'
import { toast } from 'react-toastify'

export default function SubmitProject({ setPage }) {
  const { user } = useAuth()
  const { addProject } = useProjects()
  const [form, setForm] = useState({ title: '', description: '' })
  const [files, setFiles] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef()

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Project title is required'
    else if (form.title.length < 5) e.title = 'Title must be at least 5 characters'
    else if (form.title.length > 120) e.title = 'Title must be under 120 characters'
    if (!form.description.trim()) e.description = 'Description is required'
    else if (form.description.length < 20) e.description = 'Description must be at least 20 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setProgress(0)

    // build form data for upload
    const formData = new FormData()
    formData.append('title', form.title.trim())
    formData.append('description', form.description.trim())
    files.forEach(f => formData.append('files[]', f))

    try {
      await addProject(formData, user, {
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100))
          }
        }
      })

      toast.success('🚀 Project submitted! You\'ll receive a confirmation email shortly.')
      setSubmitted(true)
    } catch (err) {
      console.error('submit error', err)
      toast.error('Failed to submit project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const handleFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      return ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'xlsx', 'xls', 'zip'].includes(ext)
    })
    if (valid.length < newFiles.length) {
      toast.warning('Some files were skipped (unsupported format)')
    }
    setFiles(prev => [...prev, ...valid].slice(0, 5))
  }

  const removeFile = (idx) => setFiles(prev => prev.filter((_, i) => i !== idx))

  const fileIcons = { pdf: 'bi-filetype-pdf', doc: 'bi-filetype-doc', docx: 'bi-filetype-docx', png: 'bi-filetype-png', jpg: 'bi-filetype-jpg', jpeg: 'bi-filetype-jpg', xlsx: 'bi-filetype-xlsx', zip: 'bi-file-zip' }

  if (submitted) {
    return (
      <div className="pf-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 64, marginBottom: 20, animation: 'bounceIn 0.5s' }}>🎉</div>
          <h2 style={{ marginBottom: 10, fontFamily: 'Syne' }}>Project Submitted!</h2>
          <p className="text-muted-pf" style={{ marginBottom: 28 }}>
            Your project has been submitted for review. You'll receive an email confirmation and updates on its status.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="pf-btn pf-btn-ghost" onClick={() => setPage('projects')}>
              <i className="bi bi-folder2-open" /> View Projects
            </button>
            <button className="pf-btn pf-btn-primary" onClick={() => { setSubmitted(false); setForm({ title: '', description: '' }); setFiles([]) }}>
              <i className="bi bi-plus" /> Submit Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="pf-page">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, marginBottom: 6 }}>Submit New Project</h1>
          <p className="text-muted-pf">Fill in the details below. An admin will review your submission and you'll be notified via email.</p>
        </div>

        {/* Progress */}
        {loading && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span className="text-muted-pf">Submitting project...</span>
              <span className="text-accent">{progress}%</span>
            </div>
            <div className="pf-progress">
              <div className="pf-progress-bar blue" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="pf-card">
              <h6 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20 }}>Project Details</h6>

              <div className="pf-form-group">
                <label className="pf-label">
                  Project Title <span className="text-danger-pf">*</span>
                </label>
                <input
                  className={`pf-input ${errors.title ? 'is-invalid' : form.title ? 'is-valid' : ''}`}
                  placeholder="e.g. E-Commerce Platform Redesign"
                  value={form.title}
                  onChange={e => { setForm({ ...form, title: e.target.value }); setErrors({ ...errors, title: '' }) }}
                  maxLength={120}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  {errors.title ? <div className="pf-error-msg">{errors.title}</div> : <div />}
                  <div className="text-muted-pf fs-xs">{form.title.length}/120</div>
                </div>
              </div>

              <div className="pf-form-group">
                <label className="pf-label">
                  Description <span className="text-danger-pf">*</span>
                </label>
                <textarea
                  className={`pf-textarea ${errors.description ? 'is-invalid' : ''}`}
                  placeholder="Provide a detailed description of the project, its goals, scope, and expected outcomes..."
                  value={form.description}
                  onChange={e => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: '' }) }}
                  rows={6}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                  {errors.description ? <div className="pf-error-msg">{errors.description}</div> : <div />}
                  <div className="text-muted-pf fs-xs">{form.description.length} chars {form.description.length < 20 && form.description.length > 0 ? `(${20 - form.description.length} more needed)` : ''}</div>
                </div>
              </div>

              {/* File Upload */}
              <div className="pf-form-group">
                <label className="pf-label">Attachments <span className="text-muted-pf">(Optional, max 5)</span></label>
                <div
                  className={`pf-dropzone ${dragOver ? 'drag-over' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                >
                  <i className="bi bi-cloud-upload" />
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Drop files here or click to browse</div>
                  <div className="text-muted-pf fs-xs">PDF, DOC, DOCX, PNG, JPG, XLSX, ZIP — max 10MB each</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.zip"
                    style={{ display: 'none' }}
                    onChange={e => handleFiles(e.target.files)}
                  />
                </div>

                {files.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {files.map((f, i) => {
                      const ext = f.name.split('.').pop().toLowerCase()
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--pf-surface-2)', borderRadius: 10, padding: '10px 14px' }}>
                          <i className={`bi ${fileIcons[ext] || 'bi-file-earmark'}`} style={{ color: 'var(--pf-accent)', fontSize: 18 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                            <div className="text-muted-pf fs-xs">{formatSize(f.size)}</div>
                          </div>
                          <button className="pf-btn pf-btn-ghost pf-btn-sm" style={{ color: 'var(--pf-danger)', borderColor: 'transparent', padding: '4px 8px' }} onClick={() => removeFile(i)}>
                            <i className="bi bi-trash" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <div className="col-lg-4">
            <div className="pf-card" style={{ marginBottom: 16 }}>
              <h6 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Submission Checklist</h6>
              {[
                { label: 'Title (5-120 chars)', ok: form.title.length >= 5 && form.title.length <= 120 },
                { label: 'Description (20+ chars)', ok: form.description.length >= 20 },
                { label: 'Files attached', ok: files.length > 0 },
              ].map(({ label, ok }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13 }}>
                  <i className={`bi ${ok ? 'bi-check-circle-fill text-success-pf' : 'bi-circle text-muted-pf'}`} />
                  <span style={{ color: ok ? 'var(--pf-text)' : 'var(--pf-text-muted)' }}>{label}</span>
                </div>
              ))}
            </div>

            <div className="pf-card" style={{ marginBottom: 16 }}>
              <h6 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 10, fontSize: 14 }}>What happens next?</h6>
              {[
                ['1', 'You receive a confirmation email'],
                ['2', 'An admin reviews your submission'],
                ['3', 'You\'re notified of the decision'],
              ].map(([num, text]) => (
                <div key={num} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 12.5 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--pf-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{num}</div>
                  <span className="text-muted-pf">{text}</span>
                </div>
              ))}
            </div>

            <button
              className="pf-btn pf-btn-primary pf-btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <><span className="pf-spinner" style={{ marginRight: 8 }} />Submitting...</>
              ) : (
                <><i className="bi bi-send" /> Submit Project</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}