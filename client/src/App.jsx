import React, { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import ParentDashboard from './pages/ParentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import AdminDashboard from './pages/AdminDashboard'
import Chat from './pages/Chat'
import DailyJournal from './pages/DailyJournal'
import GradeSpace from './pages/GradeSpace'
import TermRecords from './pages/TermRecords'

// Protected Route Component
function ProtectedRoute({ component: Component, role, userRole, userId, refId, onLogout }) {
  if (!userRole) {
    return <Navigate to="/login" replace />
  }
  if (role && !role.includes(userRole)) {
    return <Navigate to="/login" replace />
  }
  return <Component userId={userId} refId={refId} parentId={refId} teacherId={refId} userRole={userRole} onLogout={onLogout} />
}

export default function App() {
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [refId, setRefId] = useState(null)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token')
    const storedRole = localStorage.getItem('role')
    const storedUserId = localStorage.getItem('userId')
    const storedRefId = localStorage.getItem('refId')

    if (token && storedRole && storedUserId) {
      setRole(storedRole)
      setUserId(storedUserId)
      setRefId(storedRefId)
    }
  }, [])

  const onLogin = (r, id, ref) => {
    setRole(r)
    setUserId(id)
    setRefId(ref)
    localStorage.setItem('role', r)
    localStorage.setItem('userId', id)
    localStorage.setItem('refId', ref)
  }

  const onLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    localStorage.removeItem('refId')
    setRole(null)
    setUserId(null)
    setRefId(null)
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={onLogin} />} />
        
        {/* Main Dashboards */}
        <Route
          path="/parent-dashboard"
          element={
            <ProtectedRoute
              component={ParentDashboard}
              role={['parent']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="/teacher-dashboard"
          element={
            <ProtectedRoute
              component={TeacherDashboard}
              role={['teacher']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute
              component={AdminDashboard}
              role={['admin']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />

        {/* Chat Routes */}
        <Route
          path="/chat/teacher/:teacherId"
          element={
            <ProtectedRoute
              component={Chat}
              role={['parent']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="/chat/parent/:parentId"
          element={
            <ProtectedRoute
              component={Chat}
              role={['teacher']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />

        {/* Daily Journal Routes */}
        <Route
          path="/daily-journal/:grade"
          element={
            <ProtectedRoute
              component={DailyJournal}
              role={['parent', 'teacher']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />

        {/* Term Records Routes */}
        <Route
          path="/student/:studentId/term/:term"
          element={
            <ProtectedRoute
              component={TermRecords}
              role={['parent', 'teacher']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />
        <Route
          path="/term-records/:term"
          element={
            <ProtectedRoute
              component={TermRecords}
              role={['teacher']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />

        {/* Grade Space Routes */}
        <Route
          path="/grade-space/:grade"
          element={
            <ProtectedRoute
              component={GradeSpace}
              role={['parent', 'teacher']}
              userRole={role}
              userId={userId}
              refId={refId}
              onLogout={onLogout}
            />
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </ErrorBoundary>
  )
}
