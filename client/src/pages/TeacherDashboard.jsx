import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, API_BASE } from '../lib/api'
import { io } from 'socket.io-client'
import Calendar from '../components/Calendar'
import '../styles/TeacherDashboard.css'

export default function TeacherDashboard({ userId, teacherId, onLogout }){
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [record, setRecord] = useState({ term:'', subject:'', score:'', remarks:'' })
  const [parentData, setParentData] = useState({ name:'', contact:'' })
  const [newStudentData, setNewStudentData] = useState({ uniqueID:'', name:'', grade:'', homeLocation:'' })
  const [createdCreds, setCreatedCreds] = useState(null)
  const [teacherMessageText, setTeacherMessageText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const socketRef = useRef(null)
  const convoRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(()=>{
    socketRef.current = io(API_BASE.replace('/api',''))
    socketRef.current.on('connect', ()=>{ 
      console.log('Socket connected (teacher)', socketRef.current.id)
      socketRef.current.emit('join', userId)
      console.log('Teacher emitted join for', userId)
    })
    socketRef.current.on('message', (msg)=>{
      console.log('Teacher received message event:', JSON.stringify(msg, null, 2))
      setOtherIsTyping(false)
      
      // Only append if we have an active conversation
      // AND the message is either from us or to us in the current conversation
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
    socketRef.current.on('userTyping', (data) => {
      // Check if parent whose ID is in current conversation is typing
      if(studentDetails?._activeConversation?.otherUserId && data.fromUserId === String(studentDetails._activeConversation.otherUserId)) {
        setOtherIsTyping(true)
      }
    })
    return ()=>{ socketRef.current?.disconnect() }
  },[userId])

  useEffect(()=>{ if(teacherId) fetchStudents() },[teacherId])

  const fetchStudents = async ()=>{
    try{
      const res = await api.get(`/teachers/${teacherId}/students`)
      setStudents(res.data.students || [])
    }catch(err){ console.error(err) }
  }

  const selectStudent = async (id)=>{
    setSelectedStudent(id)
    try{
      const res = await api.get(`/students/${id}`)
      setStudentDetails(res.data.student)
    }catch(err){ console.error(err) }
  }

  const addRecord = async () => {
    if (!studentDetails?._id) {
      alert('Select a student before adding a record.')
      return
    }
    if (!String(record.term).trim() || !record.subject.trim()) {
      alert('Term and subject are required.')
      return
    }
    const cleanedTerm = String(record.term).trim().toLowerCase().replace(/^term\s*/i, '')
    const numericTerm = Number(cleanedTerm)
    if (!Number.isInteger(numericTerm) || numericTerm < 1 || numericTerm > 3) {
      alert('Term must be a valid CBC term number (1, 2, or 3).')
      return
    }

    try {
      await api.post(`/students/${studentDetails._id}/academic-records`, {
        term: numericTerm,
        subject: record.subject.trim(),
        score: record.score ? Number(record.score) : undefined,
        remarks: record.remarks.trim()
      })
      setRecord({ term:'', subject:'', score:'', remarks:'' })
      selectStudent(studentDetails._id)
    } catch (err) {
      console.error('Add academic record error:', err)
      alert(err?.response?.data?.message || err.message || 'Unable to add record')
    }
  }

  const startChatWithParent = async (parentRefId, parentName) =>{
    try{
      // find parent user id
        const userIdTo = parentRefId; // Directly use parentRefId as userIdTo
      const res = await api.get(`/messages/conversation/${userIdTo}`)
      const msgs = res.data.messages || []
      console.log('Conversation with', parentName, msgs)
      // NO NEED to join parent's room - we're already in our own room (teacher's userId)
      // Messages from parent will be sent to our room automatically
      setStudentDetails(prev => ({ ...prev, _activeConversation: { otherUserId: userIdTo, otherName: parentName, messages: msgs } }))
    }catch(err){ console.error(err); alert('Could not start chat') }
  }

  const handleTeacherMessageInputChange = (e) => {
    setTeacherMessageText(e.target.value)
    setIsTyping(true)
    if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    if(socketRef.current && studentDetails?._activeConversation?.otherUserId) {
      socketRef.current.emit('typing', { toUserId: studentDetails._activeConversation.otherUserId, fromUserId: userId })
    }
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000)
  }

  const sendMessageToParent = async () =>{
    const convo = studentDetails?._activeConversation
    if(!convo || !teacherMessageText.trim()) return
    try{
      // Determine recipient
      let toUser = convo.otherUserId
      console.log('[SEND] Teacher sending message. currentUser:', String(userId), 'convo.otherUserId:', String(toUser))
      if(String(toUser) === String(userId)){
        // Try to infer recipient from conversation messages
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
          console.error('[SEND] Could not determine recipient')
          alert('Unable to determine recipient. Please re-open the conversation.')
          return
        }
      }

      console.log('[SEND] Posting message to toUserId=', toUser)
      await api.post('/messages', { toUserId: toUser, text: teacherMessageText, studentId: selectedStudent })
      setTeacherMessageText('')
      setIsTyping(false)
      setTimeout(()=> convoRef.current?.scrollTo(0, convoRef.current.scrollHeight), 50)
    }catch(err){
      console.error('Message send error:', err)
      alert('Failed to send message: ' + (err?.response?.data?.message || err.message))
    }
  }

  const handleTeacherKeyPress = (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageToParent()
    }
  }

  const addParentAndStudent = async ()=>{
    try{
      const res = await api.post(`/teachers/${teacherId}/add-parent-student`, { parent: parentData, student: newStudentData })
      setCreatedCreds(res.data.credentials)
      // refresh students
      fetchStudents()
    }catch(err){ console.error(err); alert(err?.response?.data?.message || 'Error') }
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
          <div>Teacher Dashboard</div>
          <div>
            <button onClick={logout} style={{background:'transparent',color:'var(--blue)',border:'1px solid var(--border-gray)',padding:'8px 10px',borderRadius:6}}>Logout</button>
          </div>
        </div>
      </header>
      <main style={{display:'flex',gap:16}}>
        <aside style={{width:280}}>
          <h3>Your Students</h3>
          <ul>
            {students.map(s=> (
              <li key={s._id} style={{cursor:'pointer'}} onClick={()=>selectStudent(s._id)}>{s.name} — {s.grade}</li>
            ))}
          </ul>
        </aside>

        <section style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:24}}>
            <span style={{color:'#6b7280'}}>View class term records:</span>
            {[1,2,3].map(t => (
              <button
                key={t}
                onClick={() => navigate(`/term-records/${t}`)}
                style={{
                  padding:'10px 14px',
                  border:'1px solid #ccd7ef',
                  borderRadius:8,
                  background:'white',
                  color:'#172d5a',
                  cursor:'pointer',
                  minWidth: 110,
                  fontWeight: 600
                }}
              >
                Class Term {t}
              </button>
            ))}
          </div>

          {!studentDetails && <p>Select a student to view and update academic records.</p>}
          {studentDetails && (
            <>
              <h2>{studentDetails.name}</h2>
              <h4>Term Records</h4>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:16}}>
                {[1,2,3].map(t => (
                  <button
                    key={t}
                    onClick={() => navigate(`/student/${selectedStudent}/term/${t}`)}
                    disabled={!selectedStudent}
                    style={{
                      padding:'10px 14px',
                      border: selectedStudent ? '1px solid #ccd7ef' : '1px solid #e5e7eb',
                      borderRadius:8,
                      background: selectedStudent ? (window.location.pathname.endsWith(`/term/${t}`) ? '#eef4ff' : 'white') : '#f3f4f6',
                      color: selectedStudent ? '#172d5a' : '#9ca3af',
                      cursor: selectedStudent ? 'pointer' : 'not-allowed',
                      minWidth: 110,
                      fontWeight: 600
                    }}
                  >
                    View Term {t}
                  </button>
                ))}
              </div>
              
              <p style={{color:'#475569', lineHeight:1.6}}>
                Click a term button to open the dedicated term records page. From there you can add, edit, delete, or download records for this student or the full class.
              </p>

              <h4>Parents</h4>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {(studentDetails.parentIDs||[]).length === 0 && <p style={{color:'#999'}}>No parents linked to this student</p>}
                {(studentDetails.parentIDs||[]).map((p)=> (
                  <div key={p._id} style={{border:'1px solid #e6eef8',padding:12,borderRadius:6,background:'#fafbfc'}}>
                    <div style={{marginBottom:6}}>
                      <strong>{p?.name || 'Parent'}</strong>
                      <div style={{fontSize:12,color:'#666',marginTop:2}}>
                        📞 {p.contact || 'No contact provided'}
                      </div>
                    </div>
                    <button 
                      onClick={()=> navigate(`/chat/parent/${p.userId}`)}
                      style={{
                        width:'100%',
                        padding:'8px 12px',
                        background:'var(--blue)',
                        color:'white',
                        border:'none',
                        borderRadius:4,
                        cursor:'pointer',
                        fontSize:13,
                        fontWeight:500,
                        marginBottom:6
                      }}
                    >
                      💬 Message {(p?.name || 'Parent').split(' ')[0]}
                    </button>
                  </div>
                ))}
              </div>

              <h4>Grade Features</h4>
              <div style={{display:'flex',gap:8,marginBottom:16}}>
                <button
                  onClick={() => navigate(`/daily-journal/${studentDetails.grade}`)}
                  style={{
                    flex:1,
                    padding:'10px 16px',
                    background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color:'white',
                    border:'none',
                    borderRadius:6,
                    cursor:'pointer',
                    fontWeight:500,
                    fontSize:14
                  }}
                >
                   Daily Journal
                </button>
                <button
                  onClick={() => navigate(`/grade-space/${studentDetails.grade}`)}
                  style={{
                    flex:1,
                    padding:'10px 16px',
                    background:'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color:'white',
                    border:'none',
                    borderRadius:6,
                    cursor:'pointer',
                    fontWeight:500,
                    fontSize:14
                  }}
                >
                   Grade Space
                </button>
              </div>
              <div style={{marginTop:8, display:'grid', gap:10, maxWidth:360}}>
                <select value={record.term} onChange={e => setRecord({...record, term: e.target.value})} style={{padding:'10px 12px', borderRadius:6, border:'1px solid #d1d7e0'}}>
                  <option value="">Select Term</option>
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
                <input placeholder="Subject" value={record.subject} onChange={e=>setRecord({...record,subject:e.target.value})} style={{padding:'10px 12px', borderRadius:6, border:'1px solid #d1d7e0'}} />
                <input placeholder="Score" value={record.score} onChange={e=>setRecord({...record,score:e.target.value})} style={{padding:'10px 12px', borderRadius:6, border:'1px solid #d1d7e0'}} />
                <input placeholder="Remarks" value={record.remarks} onChange={e=>setRecord({...record,remarks:e.target.value})} style={{padding:'10px 12px', borderRadius:6, border:'1px solid #d1d7e0'}} />
                <button onClick={addRecord} style={{padding:'10px 14px', borderRadius:6, border:'none', background:'#667eea', color:'white', cursor:'pointer'}}>Add Record</button>
              </div>
            </>
          )}

          <hr />
          <Calendar userRole="teacher" userId={userId} teacherId={teacherId} />
          <hr />
          <h3>Add Parent & Student</h3>
          <div style={{display:'flex',gap:8}}>
            <div style={{flex:1}}>
              <h4>Parent</h4>
              <input placeholder="Parent Name" value={parentData.name} onChange={e=>setParentData({...parentData,name:e.target.value})} />
              <input placeholder="Contact" value={parentData.contact} onChange={e=>setParentData({...parentData,contact:e.target.value})} />
            </div>
            <div style={{flex:1}}>
              <h4>Student</h4>
              <input placeholder="Student ID" value={newStudentData.uniqueID} onChange={e=>setNewStudentData({...newStudentData,uniqueID:e.target.value})} />
              <input placeholder="Student Name" value={newStudentData.name} onChange={e=>setNewStudentData({...newStudentData,name:e.target.value})} />
              <input placeholder="Grade" value={newStudentData.grade} onChange={e=>setNewStudentData({...newStudentData,grade:e.target.value})} />
              <input placeholder="Home Location" value={newStudentData.homeLocation} onChange={e=>setNewStudentData({...newStudentData,homeLocation:e.target.value})} />
            </div>
          </div>
          <button onClick={addParentAndStudent}>Create Parent & Student</button>
          {createdCreds && (
            <div style={{marginTop:8}}>
              <strong>Credentials:</strong>
              <div>Username: {createdCreds.username}</div>
              <div>Password: {createdCreds.password}</div>
            </div>
          )}
          {studentDetails && studentDetails._activeConversation && (
            <div style={{marginTop:16}}>
              <h4>Direct Message with {studentDetails._activeConversation.otherName}</h4>
              <div style={{fontSize:12,color:'#666',marginBottom:8}}>
                Click a parent to see conversation here.
              </div>
              <div ref={convoRef} style={{border:'1px solid #e6eef8',padding:12,height:280,overflowY:'auto',background:'#fff',borderRadius:6,marginBottom:8}}>
                {(!studentDetails._activeConversation?.messages || studentDetails._activeConversation.messages.length === 0) && (
                  <div style={{textAlign:'center',color:'#999',paddingTop:24}}>No messages yet. Click a parent to start conversing!</div>
                )}
                {(studentDetails._activeConversation.messages||[]).map((m,i)=>{
                  const fromId = m.fromUser && (m.fromUser._id || m.fromUser)
                  const isMe = String(fromId) === String(userId)
                  const role = m.fromUser?.role
                  const displayName = m.fromUser?.displayName || m.fromUser?.username || 'Unknown'
                  const sender = isMe ? 'You' : `${role === 'parent' ? 'Parent' : 'Teacher'}: ${displayName}`
                  const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''
                  const readStatus = m.read ? '✓✓' : '✓'
                  return (
                    <div key={i} className="message" style={{justifyContent: isMe ? 'flex-end' : 'flex-start'}}>
                      <div className="bubble">
                        {!isMe && <div className="bubble-header">{sender}</div>}
                        <div>{m.text || ''}</div>
                        {time && <div className="bubble-time">{time} {isMe && readStatus}</div>}
                      </div>
                    </div>
                  )
                })}
                {otherIsTyping && (
                  <div style={{color:'#999',fontSize:13,fontStyle:'italic',marginTop:8}}>Parent is typing...</div>
                )}
              </div>
              <div className="message-input-area">
                <input 
                  value={teacherMessageText} 
                  onChange={handleTeacherMessageInputChange}
                  onKeyPress={handleTeacherKeyPress}
                  placeholder="Write a message to parent..." />
                <button onClick={sendMessageToParent}>Send</button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
