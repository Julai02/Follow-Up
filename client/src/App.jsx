import React from 'react'
import { useState } from 'react'
import Login from './pages/Login'
import ParentDashboard from './pages/ParentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'

export default function App(){
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)

  if(!role) return <Login onLogin={(r, id)=>{ setRole(r); setUserId(id); }} />
  if(role === 'parent') return <ParentDashboard userId={userId} />
  if(role === 'teacher') return <TeacherDashboard userId={userId} />
  return <div>Unknown role</div>
}
