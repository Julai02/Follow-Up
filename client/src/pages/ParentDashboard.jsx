import React, { useEffect, useState, useRef } from 'react'
import { api, API_BASE } from '../lib/api'
import { io } from 'socket.io-client'

export default function ParentDashboard({ userId, parentId, onLogout }){
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [messageText, setMessageText] = useState('')
  const [currentChatUser, setCurrentChatUser] = useState(null)
  const [currentChatName, setCurrentChatName] = useState('')
  const socketRef = useRef(null)
  const convoRef = useRef(null)

  useEffect(()=>{
    // connect socket
    socketRef.current = io(API_BASE.replace('/api',''))
    socketRef.current.on('connect', ()=>{
      console.log('Socket connected (parent)', socketRef.current.id)
      socketRef.current.emit('join', userId)
      console.log('Parent emitted join for', userId)
    })
    socketRef.current.on('message', (msg)=>{
      console.log('Parent received message event:', JSON.stringify(msg, null, 2))
      
      setStudentDetails(prev => {
        if(!prev?._activeConversation) {
          console.log('No active conversation, ignoring message')
          return prev
        }
        
        const otherUserId = prev._activeConversation.otherUserId
        const fromId = String(msg.fromUser?._id || msg.fromUser)
        const toId = String(msg.toUser?._id || msg.toUser)
        const currentUserId = String(userId)
        
        console.log(`Message validation: from=${fromId}, to=${toId}, current=${currentUserId}, other=${otherUserId}`)
        
        // Valid if: (I sent to them) OR (they sent to me)
        const isFromCurrent = fromId === currentUserId
        const isToCurrent = toId === currentUserId
        const isFromOther = fromId === otherUserId
        const isToOther = toId === otherUserId
        
        const isValid = (isFromCurrent && isToOther) || (isFromOther && isToCurrent)
        console.log(`  From current? ${isFromCurrent}, To current? ${isToCurrent}, From other? ${isFromOther}, To other? ${isToOther} => Valid? ${isValid}`)
        
        if(!isValid) {
          console.log('Message not for current conversation, ignoring')
          return prev
        }
        
        console.log('Message is valid, appending')
        return { ...prev, _activeConversation: { ...prev._activeConversation, messages: [...(prev._activeConversation.messages||[]), msg] } }
      })
    })
    return ()=>{ socketRef.current?.disconnect() }
  },[userId])

  useEffect(()=>{ if(parentId) fetchChildren() },[parentId])

  const fetchChildren = async ()=>{
    try{
      const res = await api.get(`/students/parent/${parentId}`)
      setChildren(res.data.children || res.data)
    }catch(err){ console.error(err) }
  }

  const selectChild = async (childId)=>{
    setSelectedChild(childId)
    try{
      const res = await api.get(`/students/${childId}`)
      const student = res.data.student
      setStudentDetails(student)
      // fetch teachers for grade
      const grade = encodeURIComponent(student.grade)
      const t = await api.get(`/teachers/grade/${grade}`)
      setTeachers(t.data.teachers || [])
      setConversation([])
    }catch(err){ console.error(err) }
  }

  const startChatWith = async (teacherUserId, teacherName)=>{
    try{
      const res = await api.get(`/messages/conversation/${teacherUserId}`)
      const msgs = res.data.messages || []
      setCurrentChatUser(teacherUserId)
      setCurrentChatName(teacherName || '')
      // Store messages in studentDetails._activeConversation (similar to teacher pattern)
      setStudentDetails(prev => ({ ...prev, _activeConversation: { otherUserId: teacherUserId, otherName: teacherName, messages: msgs } }))
      // NO NEED to join teacher's room - we're already in our own room (parent's userId)
      // Messages from teacher will be sent to our room automatically
    }catch(err){ console.error(err) }
  }

  const sendMessage = async ()=>{
    const convo = studentDetails?._activeConversation
    if(!convo || !messageText.trim()) return
    try{
      // Determine recipient
      let toUser = convo.otherUserId
      console.log('[SEND] Parent sending message. currentUser:', String(userId), 'convo.otherUserId:', String(toUser))
      if(String(toUser) === String(userId)){
        const msgs = convo.messages || []
        let inferred = null
        for(const m of msgs){
          const f = String(m.fromUser?._id || m.fromUser)
          const t = String(m.toUser?._id || m.toUser)
          if(f !== String(userId)) { inferred = f; break }
          if(t !== String(userId)) { inferred = t; break }
        }
        if(inferred && inferred !== String(userId)){
          console.log('[SEND] Inferred recipient from messages:', inferred)
          toUser = inferred
        } else {
          console.error('[SEND] Could not determine recipient (toUser equals current user and no inference possible). Aborting.')
          alert('Unable to determine recipient for this message. Please re-open the conversation.')
          return
        }
      }
      console.log('[SEND] Posting message to toUserId=', toUser)
      await api.post('/messages', { toUserId: toUser, text: messageText, studentId: selectedChild })
      setMessageText('')
      setTimeout(()=> convoRef.current?.scrollTo(0, convoRef.current.scrollHeight), 50)
    }catch(err){ console.error(err) }
  }

  const handleKeyPress = (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const logout = ()=>{
    try{ localStorage.removeItem('token') }catch(e){}
    if(typeof onLogout === 'function') onLogout()
    else window.location.reload()
  }

  return (
    <div className="dashboard">
      <header className="topbar">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>Parent Dashboard</div>
          <div>
            <button onClick={logout} style={{background:'transparent',color:'var(--blue)',border:'1px solid var(--border-gray)',padding:'8px 10px',borderRadius:6}}>Logout</button>
          </div>
        </div>
      </header>
      <main style={{display:'flex',gap:16}}>
        <section style={{width:240}}>
          <h3>Your Children</h3>
          {children.length===0 && <p>No children found.</p>}
          <ul>
            {children.map(c=> (
              <li key={c._id} style={{cursor:'pointer'}} onClick={()=>selectChild(c._id)}>{c.name} — {c.grade}</li>
            ))}
          </ul>
        </section>

        <section style={{flex:1}}>
          {!studentDetails && <p>Select a child to view details</p>}
          {studentDetails && (
            <>
              <h2>{studentDetails.name} — {studentDetails.grade}</h2>
              <p><strong>Home:</strong> {studentDetails.homeLocation}</p>
              <h4>Academic Records</h4>
              <ul>
                { (studentDetails.academicRecords||[]).map((r,i)=> (
                  <li key={i}>{r.term} / {r.subject}: {r.score} — {r.remarks}</li>
                )) }
              </ul>

              <h4>Class Teachers</h4>
              <ul>
                {teachers.map(t=> (
                  <li key={t.teacher._id}>
                    {t.teacher.name} — {t.teacher.subject} — {t.teacher.contact}
                    <button style={{marginLeft:8}} onClick={()=>startChatWith(t.user?._id)}>Message</button>
                  </li>
                ))}
              </ul>

              <h4>Conversation {currentChatName && `with ${currentChatName}`}</h4>
              <div ref={convoRef} style={{border:'1px solid #e6eef8',padding:12,height:280,overflowY:'auto',background:'#fff',borderRadius:6,marginBottom:8}}>
                {(!studentDetails._activeConversation?.messages || studentDetails._activeConversation.messages.length === 0) && (
                  <div style={{textAlign:'center',color:'#999',paddingTop:24}}>No messages yet. Start a conversation!</div>
                )}
                {(studentDetails._activeConversation?.messages||[]).map((m,i)=>{
                  const fromId = m.fromUser && (m.fromUser._id || m.fromUser)
                  const isMe = String(fromId) === String(userId)
                  const sender = isMe ? 'You' : (m.fromUser && m.fromUser.username) || 'Teacher'
                  const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''
                  return (
                    <div key={i} className="message" style={{justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                      <div className="bubble">
                        {!isMe && <div className="bubble-header">{sender}</div>}
                        <div>{m.text || ''}</div>
                        {time && <div className="bubble-time">{time}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="message-input-area">
                <input 
                  value={messageText} 
                  onChange={e=>setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Write a message..." />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
