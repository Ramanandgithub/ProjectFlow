import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import ProjectsList from './pages/ProjectsList'
import SubmitProject from './pages/Submitproject'
import AuditLogs from './pages/Auditlogs'
import UserManagement from './pages/Usermanagement'
import Profile from './pages/Profile'
import Sidebar from './components/Sidebar'

import { useLocation, useNavigate } from 'react-router-dom'

function AppInner() {
  const { user, isAdmin, ready } = useAuth()
  const [authMode, setAuthMode] = useState('login')
  const location = useLocation()
  const navigate = useNavigate()

  const page = location.pathname === '/' || location.pathname === '' ? 'dashboard' : location.pathname.replace(/\//g, '')

  const setPage = (targetPage) => {
    const route = targetPage === 'dashboard' ? '/' : `/${targetPage}`
    navigate(route)
  }

  if (!ready) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onSwitch={() => setAuthMode('register')} />} />
        <Route path="/register" element={<RegisterPage onSwitch={() => setAuthMode('login')} />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    )
  }

  const pageTitles = {
    dashboard: 'Dashboard',
    projects: isAdmin ? 'All Projects' : 'My Projects',
    submit: 'Submit Project',
    audit: 'Audit Logs',
    users: 'User Management',
    profile: 'Profile',
  }

  return (
    <div className="pf-layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="pf-main">
        <div className="pf-topbar">
          <div className="pf-topbar-title">{pageTitles[page] || 'ProjectFlow'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAdmin && (
              <span style={{ fontSize: 11, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', padding: '3px 10px', borderRadius: 20, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Admin
              </span>
            )}
            <button
              className="pf-btn pf-btn-primary pf-btn-sm"
              onClick={() => setPage('submit')}
              style={{ gap: 6 }}
            >
              <i className="bi bi-plus" /> New Project
            </button>
          </div>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard setPage={setPage} />} />
          <Route path="/dashboard" element={<Dashboard setPage={setPage} />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/submit" element={<SubmitProject setPage={setPage} />} />
          <Route path="/audit" element={isAdmin ? <AuditLogs /> : <Dashboard setPage={setPage} />} />
          <Route path="/users" element={isAdmin ? <UserManagement /> : <Navigate to="/dashboard" />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <AppInner />
        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          theme="dark"
          toastStyle={{ fontFamily: 'DM Sans, sans-serif' }}
        />
      </ProjectProvider>
    </AuthProvider>
  )
}