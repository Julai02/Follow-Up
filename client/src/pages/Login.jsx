import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/Login.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await axios.post(`${API}/auth/login`, { username, password })
      const { token, role, userId, refId } = res.data
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
      localStorage.setItem('userId', userId)
      localStorage.setItem('refId', refId)
      
      onLogin(role, userId, refId)

      // Navigate based on role
      if (role === 'parent') {
        navigate('/parent-dashboard')
      } else if (role === 'teacher') {
        navigate('/teacher-dashboard')
      } else if (role === 'admin') {
        navigate('/admin-dashboard')
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Dynamic animated background */}
      <div className="login-background">
        <img src="/background1.png" alt="background" className="background-image bg1" />
        <img src="/background2.png" alt="kids" className="background-image bg2" />
      </div>
      {/* Login form */}
      <form onSubmit={submit} className="login-box">
        <div className="logo-container">
          <img src="/logo.png" alt="Follow Up Logo" className="logo" />
        </div>
        <h2>Follow Up</h2>
        <p className="tagline">Parent-Teacher Communication</p>
        <input 
          placeholder="username" 
          value={username} 
          onChange={e => setUsername(e.target.value)} 
          disabled={isLoading}
        />
        <input 
          placeholder="password" 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div className="error">{error}</div>}
        <div className="thesis-link">
          <a href="/THESIS_DOCUMENT_UPDATED Follow-Up.pdf" download>
            📄 Download Project Thesis
          </a>
        </div>
        <div className="copyright" style={{marginTop:12,textAlign:'center',fontSize:12,color:'#9aa'}}>
          © {new Date().getFullYear()} HolyTech Farm Ltd. All rights reserved.
        </div>
      </form>
    </div>
  )
}
