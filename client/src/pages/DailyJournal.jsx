import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import '../styles/DailyJournal.css'

export default function DailyJournal({ userId, onLogout }) {
  const navigate = useNavigate()
  const { grade } = useParams()
  const [userRole, setUserRole] = useState(null)
  const [updates, setUpdates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    content: '',
    category: 'general'
  })
  const [selectedUpdate, setSelectedUpdate] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('role')
    setUserRole(role)
    fetchUpdates()
  }, [grade])

  const fetchUpdates = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/daily-updates/grade/${grade}`)
      setUpdates(res.data)
    } catch (err) {
      setError('Failed to load daily updates')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const res = await api.post('/daily-updates/create', {
        title: newUpdate.title,
        content: newUpdate.content,
        category: newUpdate.category,
        grade: grade
      })

      setUpdates([res.data.update, ...updates])
      setNewUpdate({ title: '', content: '', category: 'general' })
      setShowForm(false)
      setMessage('Post created successfully!')
    } catch (err) {
      console.error('Create update error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create post')
    }
  }

  const handleAddComment = async (updateId) => {
    if (!newComment.trim()) return

    try {
      const res = await api.post(`/daily-updates/${updateId}/comment`, {
        text: newComment
      })

      setUpdates(
        updates.map((u) =>
          u._id === updateId ? res.data.update : u
        )
      )
      setNewComment('')
      setSelectedUpdate(null)
      setMessage('Comment added!')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add comment')
    }
  }

  const handleMarkSeen = async (updateId) => {
    try {
      const res = await api.post(`/daily-updates/${updateId}/mark-seen`)
      setUpdates(
        updates.map((u) =>
          u._id === updateId ? res.data.update : u
        )
      )
      setMessage('Marked as seen!')
    } catch (err) {
      console.error('Error marking as seen:', err)
    }
  }

  return (
    <div className="daily-journal">
      <nav className="journal-navbar">
        <div className="nav-left">
          <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
          <h1>Daily Journal - {grade}</h1>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </nav>

      <div className="journal-container">
        {isLoading && <div className="loading">⏳ Loading updates...</div>}

        {userRole === 'teacher' && (
          <>
            <button
              className="create-post-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Cancel' : '+ New Post'}
            </button>

            {showForm && (
              <form onSubmit={handleCreateUpdate} className="create-form">
                <input
                  type="text"
                  placeholder="Title (e.g., Homework for today)"
                  value={newUpdate.title}
                  onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Description"
                  value={newUpdate.content}
                  onChange={(e) => setNewUpdate({ ...newUpdate, content: e.target.value })}
                  required
                  rows="5"
                />
                <select
                  value={newUpdate.category}
                  onChange={(e) => setNewUpdate({ ...newUpdate, category: e.target.value })}
                >
                  <option value="general">General</option>
                  <option value="homework">Homework</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                </select>
                <button type="submit" className="submit-btn">Post</button>
              </form>
            )}
          </>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="updates-list">
          {updates.length === 0 && !isLoading ? (
            <p className="no-data">No posts yet. {userRole === 'teacher' && 'Create the first one!'}</p>
          ) : (
            updates.map((update) => (
              <div key={update._id} className="update-card">
                <div className="update-header">
                  <div>
                    <h3>{update.title}</h3>
                    <p className="meta">
                      By {update.teacher?.name || 'Teacher'} •
                      <span className="category">{update.category}</span> •
                      {new Date(update.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {userRole === 'parent' && (
                    <button
                      className="seen-btn"
                      onClick={() => handleMarkSeen(update._id)}
                    >
                      ✓ Mark Seen
                    </button>
                  )}
                </div>

                <div className="update-content">
                  {update.content}
                </div>

                <div className="comments-section">
                  <h4>Comments ({update.comments?.length || 0})</h4>

                  {update.comments?.map((comment) => (
                    <div key={comment._id || comment.createdAt} className="comment">
                      <div className="comment-header">
                        <strong>{comment.parentName}</strong>
                        <span className="timestamp">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                  ))}

                  {userRole === 'parent' && (
                    <>
                      {selectedUpdate === update._id ? (
                        <div className="add-comment">
                          <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows="3"
                          />
                          <div className="comment-actions">
                            <button
                              onClick={() => handleAddComment(update._id)}
                              className="add-btn"
                            >
                              Add Comment
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUpdate(null)
                                setNewComment('')
                              }}
                              className="cancel-btn"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedUpdate(update._id)}
                          className="comment-btn"
                        >
                          💬 Add Comment
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
