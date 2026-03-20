import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="pf-page">
        <div className="pf-empty-state">
          <i className="bi bi-person-circle" />
          <p>No user data available.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pf-page">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, marginBottom: 4 }}>My Profile</h1>
        <p className="text-muted-pf">Your account information.</p>
      </div>
      <div className="pf-card" style={{ padding: 20 }}>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Role:</strong> {user.role}</p>
        <p><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  )
}
