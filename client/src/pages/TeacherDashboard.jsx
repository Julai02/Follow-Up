import React, { useEffect, useState, useRef } from 'react'
import { api, API_BASE } from '../lib/api'
import { io } from 'socket.io-client'

export default function TeacherDashboard({ userId, teacherId }){
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [studentDetails, setStudentDetails] = useState(null)
  const [record, setRecord] = useState({ term:'', subject:'', score:'', remarks:'' })
  const [parentData, setParentData] = useState({ name:'', contact:'' })
  const [newStudentData, setNewStudentData] = useState({ uniqueID:'', name:'', grade:'', homeLocation:'' })
  const [createdCreds, setCreatedCreds] = useState(null)
  const [teacherMessageText, setTeacherMessageText] = useState('')
  const socketRef = useRef(null)
  const convoRef = useRef(null)

  useEffect(()=>{
    socketRef.current = io(API_BASE.replace('/api',''))
    socketRef.current.on('connect', ()=>{ 
      console.log('Socket connected (teacher)', socketRef.current.id)
      socketRef.current.emit('join', userId)
      console.log('Teacher emitted join for', userId)
    })
    socketRef.current.on('message', (msg)=>{
      console.log('Teacher received message event:', JSON.stringify(msg, null, 2))
      
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
          console.error('[SEND] Could not determine recipient (toUser equals current user and no inference possible). Aborting.')
          alert('Unable to determine recipient for this message. Please re-open the conversation.')
          return
        }
      }

      console.log('[SEND] Posting message to toUserId=', toUser)
      await api.post('/messages', { toUserId: toUser, text: teacherMessageText, studentId: selectedStudent })
      setTeacherMessageText('')
      setTimeout(()=> convoRef.current?.scrollTo(0, convoRef.current.scrollHeight), 50)
    }catch(err){ console.error(err) }
  }

  const handleTeacherKeyPress = (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageToParent()
    }
  }

  const addRecord = async ()=>{
    try{
      const payload = { academicRecords: [ { term: record.term, subject: record.subject, score: Number(record.score), remarks: record.remarks } ] }
      const res = await api.put(`/students/${selectedStudent}`, payload)
      setStudentDetails(res.data.student)
      setRecord({ term:'', subject:'', score:'', remarks:'' })
    }catch(err){ 
      console.error('addRecord error:', err);
      console.error('Response data:', err?.response?.data);
      alert(err?.response?.data?.message || err.message || 'Error adding record') 
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

  return (
    <div className="dashboard">
      <header className="topbar">Teacher Dashboard</header>
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
          {!studentDetails && <p>Select a student to view and update academic records.</p>}
          {studentDetails && (
            <>
              <h2>{studentDetails.name}</h2>
              <h4>Academic Records</h4>
              <ul>
                {(studentDetails.academicRecords||[]).map((r,i)=> <li key={i}>{r.term} — {r.subject}: {r.score} ({r.remarks})</li>)}
              </ul>
              <h4>Parents</h4>
              <ul>
                {(studentDetails.parentIDs||[]).map((p)=> (
                  <li key={p._id}>{p.name} — {p.contact}
                    <button style={{marginLeft:8}} onClick={()=> startChatWithParent(p.userId, p.name)}>Message</button>
                  </li>
                ))}
              </ul>
              <div style={{marginTop:8}}>
                <input placeholder="Term" value={record.term} onChange={e=>setRecord({...record,term:e.target.value})} />
                <input placeholder="Subject" value={record.subject} onChange={e=>setRecord({...record,subject:e.target.value})} />
                <input placeholder="Score" value={record.score} onChange={e=>setRecord({...record,score:e.target.value})} />
                <input placeholder="Remarks" value={record.remarks} onChange={e=>setRecord({...record,remarks:e.target.value})} />
                <button onClick={addRecord}>Add Record</button>
              </div>
            </>
          )}

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
              <h4>Conversation with {studentDetails._activeConversation.otherName}</h4>
              <div ref={convoRef} style={{border:'1px solid #e6eef8',padding:12,height:280,overflowY:'auto',background:'#fff',borderRadius:6,marginBottom:8}}>
                {(!studentDetails._activeConversation?.messages || studentDetails._activeConversation.messages.length === 0) && (
                  <div style={{textAlign:'center',color:'#999',paddingTop:24}}>No messages yet. Start a conversation!</div>
                )}
                {(studentDetails._activeConversation.messages||[]).map((m,i)=>{
                  const fromId = m.fromUser && (m.fromUser._id || m.fromUser)
                  const isMe = String(fromId) === String(userId)
                  const sender = isMe ? 'You' : (m.fromUser && m.fromUser.username) || 'Parent'
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
                  value={teacherMessageText} 
                  onChange={e=>setTeacherMessageText(e.target.value)}
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
