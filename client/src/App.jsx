import React from 'react'
import { useState } from 'react'
import Login from './pages/Login'
import ParentDashboard from './pages/ParentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'

export default function App(){
  const [role, setRole] = useState(null)
  const [userId, setUserId] = useState(null)
  const [refId, setRefId] = useState(null)

  if(!role) return <Login onLogin={(r, id, ref)=>{ setRole(r); setUserId(id); setRefId(ref); }} />
  if(role === 'parent') return <ParentDashboard userId={userId} parentId={refId} />
  if(role === 'teacher') return <TeacherDashboard userId={userId} teacherId={refId} />
  return <div>Unknown role</div>
}
