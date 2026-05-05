import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import { api, API_BASE } from '../lib/api'
import '../styles/Chat.css'

export default function Chat({ userId, onLogout }) {
  const navigate = useNavigate()
  const { teacherId, parentId } = useParams()
  const chatPartnerId = teacherId || parentId
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [otherIsTyping, setOtherIsTyping] = useState(false)
  const [socket, setSocket] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [chatPartner, setChatPartner] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    const storedUserId = localStorage.getItem('userId')

    setUserRole(role)
    setCurrentUser({ id: storedUserId, role })

    if (!token || !storedUserId) {
      navigate('/login')
      return
    }

    // Initialize Socket.io
    const newSocket = io(API_BASE.replace('/api', ''), { auth: { token } })

    newSocket.on('connect', () => {
      console.log('Connected to socket server')
      newSocket.emit('join', storedUserId)
    })

    newSocket.on('message', (message) => {
      const msgFromId = String(message.fromUser?._id || message.fromUser)
      const msgToId = String(message.toUser?._id || message.toUser)
      const partnerId = String(chatPartnerId)
      const currentId = String(storedUserId)

      if ((msgFromId === partnerId && msgToId === currentId) || (msgFromId === currentId && msgToId === partnerId)) {
        setMessages((prev) => [...prev, message])
        scrollToBottom()
      }
    })

    newSocket.on('userTyping', (data) => {
      if (String(data.fromUserId) === String(chatPartnerId)) {
        setOtherIsTyping(true)
      }
    })

    newSocket.on('userStoppedTyping', (data) => {
      if (String(data.fromUserId) === String(chatPartnerId)) {
        setOtherIsTyping(false)
      }
    })

    setSocket(newSocket)
    fetchMessages()
    fetchChatPartner()

    return () => newSocket.disconnect()
  }, [chatPartnerId, navigate])

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/conversation/${chatPartnerId}`)
      setMessages(res.data.messages || [])
      scrollToBottom()
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  const fetchChatPartner = async () => {
    try {
      // Determine if we're chatting with a teacher or parent based on URL
      if (teacherId) {
        // Fetch teacher info
        const res = await api.get(`/teachers/${teacherId}`)
        setChatPartner({ name: res.data.teacher?.name || 'Teacher' })
      } else if (parentId) {
        // Fetch parent info - use users endpoint to get parent details
        const res = await api.get(`/users/${parentId}`)
        setChatPartner({ name: res.data.name || 'Parent' })
      }
    } catch (err) {
      // If specific fetch fails, try generic approach
      console.error('Error fetching chat partner info:', err)
      try {
        const res = await api.get(`/users/${chatPartnerId}`)
        setChatPartner({ name: res.data.name || 'Chat Participant' })
      } catch (e) {
        console.error('Fallback error:', e)
        setChatPartner({ name: teacherId ? 'Teacher' : 'Parent' })
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !socket) return

    const messageText = inputValue
    setInputValue('')
    setOtherIsTyping(false)

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    if (socket) {
      socket.emit('stopTyping', { fromUserId: currentUser.id, toUserId: chatPartnerId })
    }

    try {
      await api.post('/messages', { toUserId: chatPartnerId, text: messageText })
    } catch (err) {
      console.error('Error sending message:', err)
      setInputValue(messageText)
    }
  }

  const handleTyping = (e) => {
    setInputValue(e.target.value)

    if (socket) {
      socket.emit('typing', {
        fromUserId: currentUser.id,
        toUserId: chatPartnerId,
        fromName: currentUser.name || 'User'
      })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      if (socket) {
        socket.emit('stopTyping', { fromUserId: currentUser.id, toUserId: chatPartnerId })
      }
    }, 3000)
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <div className="header-title">
          {otherIsTyping && <span className="typing-indicator">typing...</span>}
        </div>
        <div className="chat-partner-header">
          <h3>{chatPartner?.name || 'Chat'}</h3>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">Start a conversation</div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => {
              const isOwnMessage = String(msg.fromUser?._id || msg.fromUser) === String(currentUser?.id)
              const senderName = msg.fromUser?.displayName || msg.fromUser?.username || (isOwnMessage ? 'You' : 'Sender')
              return (
                <div key={msg._id || index} className={`message ${isOwnMessage ? 'own' : 'other'}`}>
                  {!isOwnMessage && <div className="message-sender">{senderName}</div>}
                  <div className="message-bubble">
                    <div className="message-content">{msg.text}</div>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={inputValue}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}
