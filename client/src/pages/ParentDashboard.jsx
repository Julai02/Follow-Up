import React from 'react'

export default function ParentDashboard({ userId }){
  return (
    <div className="dashboard">
      <header className="topbar">Parent Dashboard</header>
      <main>
        <p>Welcome parent (userId: {userId}).</p>
        <p>This is a placeholder. We'll fetch children, records and messages here.</p>
      </main>
    </div>
  )
}
