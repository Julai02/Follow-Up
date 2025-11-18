import React, { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function Login({ onLogin }){
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
      try{
        const res = await axios.post(`${API}/auth/login`, { username, password })
        const { token, role, userId, refId } = res.data
        localStorage.setItem('token', token)
        onLogin(role, userId, refId)
    }catch(err){
      setError(err?.response?.data?.message || 'Login failed')
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
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
        {error && <div className="error">{error}</div>}
        <div className="thesis-link">
          <a href="/THESIS_DOCUMENT Follow-UP.pdf" download>
            📄 Download Project Thesis
          </a>
        </div>
      </form>
    </div>
  )
}
