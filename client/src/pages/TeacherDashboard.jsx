import React from 'react'

export default function TeacherDashboard({ userId }){
  return (
    <div className="dashboard">
      <header className="topbar">Teacher Dashboard</header>
      <main>
        <p>Welcome teacher (userId: {userId}).</p>
        <p>Place to manage students, create parents and message.</p>
      </main>
    </div>
  )
}
