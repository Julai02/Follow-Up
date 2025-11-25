import React from 'react'
import { useState } from 'react'
import Login from './pages/Login'
import ParentDashboard from './pages/ParentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'

export default function App(){
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [refId, setRefId] = useState(null)

  const onLogin = (r, id, ref) => {
    setRole(r)
    setUserId(id)
    setRefId(ref)
  }

  const onLogout = ()=>{
    // Clear token and reset app state to show login
    localStorage.removeItem('token')
    setRole(null)
    setUserId(null)
    setRefId(null)
  }

  if(!role) return <Login onLogin={onLogin} />
  if(role === 'parent') return <ParentDashboard userId={userId} parentId={refId} onLogout={onLogout} />
  if(role === 'teacher') return <TeacherDashboard userId={userId} teacherId={refId} onLogout={onLogout} />
  return <div>Unknown role</div>
}
