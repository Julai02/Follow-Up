import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import '../styles/AdminDashboard.css'

export default function AdminDashboard({ userId, onLogout }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    contact: '',
    position: '',
    subjects: [],
    grades: []
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      const res = await api.get('/admin/overview')
      setOverview(res.data)
    } catch (err) {
      console.error('Error fetching overview:', err)
    }
  }

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers')
      setTeachers(res.data)
    } catch (err) {
      console.error('Error fetching teachers:', err)
    }
  }

  const handleOnboardTeacher = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)

    try {
      const subjects = newTeacher.subjects.length > 0
        ? newTeacher.subjects
        : (newTeacher.subjects_input ? newTeacher.subjects_input.split(',').map(s => s.trim()) : [])
      const grades = newTeacher.grades.length > 0
        ? newTeacher.grades
        : (newTeacher.grades_input ? newTeacher.grades_input.split(',').map(g => g.trim()) : [])

      const res = await api.post('/admin/onboard-teacher', {
        name: newTeacher.name,
        email: newTeacher.email,
        contact: newTeacher.contact,
        position: newTeacher.position,
        subjects: subjects,
        grades: grades
      })

      setCredentials(res.data.credentials)
      setMessage(`Teacher ${newTeacher.name} onboarded successfully!`)
      setNewTeacher({
        name: '',
        email: '',
        contact: '',
        position: '',
        subjects: [],
        grades: []
      })
      fetchTeachers()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to onboard teacher')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddSubject = (subject) => {
    if (subject && !newTeacher.subjects.includes(subject)) {
      setNewTeacher({
        ...newTeacher,
        subjects: [...newTeacher.subjects, subject]
      })
    }
  }

  const handleRemoveSubject = (subject) => {
    setNewTeacher({
      ...newTeacher,
      subjects: newTeacher.subjects.filter(s => s !== subject)
    })
  }

  const handleAddGrade = (grade) => {
    if (grade && !newTeacher.grades.includes(grade)) {
      setNewTeacher({
        ...newTeacher,
        grades: [...newTeacher.grades, grade]
      })
    }
  }

  const handleRemoveGrade = (grade) => {
    setNewTeacher({
      ...newTeacher,
      grades: newTeacher.grades.filter(g => g !== grade)
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-navbar">
        <div className="nav-brand">Follow Up - Admin</div>
        <div className="nav-right">
          <span className="user-info">Admin {userId}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      <div className="admin-container">
        <div className="admin-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('overview')
              fetchOverview()
            }}
          >
            📊 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === 'onboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('onboard')}
          >
            ➕ Onboard Teacher
          </button>
          <button
            className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('teachers')
              fetchTeachers()
            }}
          >
            👨‍🏫 Teachers List
          </button>
        </div>

        <div className="admin-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-content">
              <h2>System Overview</h2>
              {overview && (
                <div className="overview-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-info">
                      <h3>Teachers</h3>
                      <p className="stat-number">{overview.teachers}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👨‍👩‍👧‍👦</div>
                    <div className="stat-info">
                      <h3>Parents</h3>
                      <p className="stat-number">{overview.parents}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-info">
                      <h3>Students</h3>
                      <p className="stat-number">{overview.students}</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                      <h3>Total Users</h3>
                      <p className="stat-number">{overview.totalUsers}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onboard Teacher Tab */}
          {activeTab === 'onboard' && (
            <div className="tab-content">
              <h2>Onboard New Teacher</h2>
              <form onSubmit={handleOnboardTeacher} className="onboard-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                    required
                    placeholder="Teacher full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                    required
                    placeholder="teacher@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Contact *</label>
                  <input
                    type="text"
                    value={newTeacher.contact}
                    onChange={(e) => setNewTeacher({ ...newTeacher, contact: e.target.value })}
                    required
                    placeholder="Phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Position</label>
                  <input
                    type="text"
                    value={newTeacher.position}
                    onChange={(e) => setNewTeacher({ ...newTeacher, position: e.target.value })}
                    placeholder="e.g., Form Teacher, Subject Teacher"
                  />
                </div>

                <div className="form-group">
                  <label>Subjects (comma-separated or add individually) *</label>
                  <div className="input-with-btn">
                    <input
                      type="text"
                      id="subject-input"
                      placeholder="e.g., Mathematics, English"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const subject = e.target.value.trim()
                          handleAddSubject(subject)
                          e.target.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('subject-input')
                        handleAddSubject(input.value.trim())
                        input.value = ''
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags">
                    {newTeacher.subjects.map((subject) => (
                      <span key={subject} className="tag">
                        {subject}
                        <button type="button" onClick={() => handleRemoveSubject(subject)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Grades/Classes (comma-separated or add individually) *</label>
                  <div className="input-with-btn">
                    <input
                      type="text"
                      id="grade-input"
                      placeholder="e.g., Grade 1, Grade 2"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const grade = e.target.value.trim()
                          handleAddGrade(grade)
                          e.target.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('grade-input')
                        handleAddGrade(input.value.trim())
                        input.value = ''
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags">
                    {newTeacher.grades.map((grade) => (
                      <span key={grade} className="tag">
                        {grade}
                        <button type="button" onClick={() => handleRemoveGrade(grade)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="submit-btn" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Onboard Teacher'}
                </button>
              </form>

              {credentials && (
                <div className="credentials-display">
                  <h3>✅ Teacher Account Created Successfully</h3>
                  <div className="credential-item">
                    <label>Username:</label>
                    <div className="credential-value">
                      <code>{credentials.username}</code>
                      <button onClick={() => copyToClipboard(credentials.username)} className="copy-btn">📋 Copy</button>
                    </div>
                  </div>
                  <div className="credential-item">
                    <label>Password:</label>
                    <div className="credential-value">
                      <code>{credentials.password}</code>
                      <button onClick={() => copyToClipboard(credentials.password)} className="copy-btn">📋 Copy</button>
                    </div>
                  </div>
                  <p className="note">{credentials.note}</p>
                </div>
              )}
            </div>
          )}

          {/* Teachers List Tab */}
          {activeTab === 'teachers' && (
            <div className="tab-content">
              <h2>All Teachers</h2>
              {teachers.length === 0 ? (
                <p>No teachers onboarded yet.</p>
              ) : (
                <div className="teachers-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Position</th>
                        <th>Subjects</th>
                        <th>Grades</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teachers.map((teacher) => (
                        <tr key={teacher._id}>
                          <td>{teacher.name}</td>
                          <td>{teacher.email || '-'}</td>
                          <td>{teacher.contact}</td>
                          <td>{teacher.position || '-'}</td>
                          <td>{teacher.subjects?.join(', ') || '-'}</td>
                          <td>{teacher.grades?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
