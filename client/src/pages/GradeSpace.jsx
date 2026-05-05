import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import '../styles/GradeSpace.css'

export default function GradeSpace({ userId, onLogout }) {
  const navigate = useNavigate()
  const { grade } = useParams()
  const [userRole, setUserRole] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'announcement'
  })
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const role = localStorage.getItem('role')
    setUserRole(role)
    fetchAnnouncements()
  }, [grade])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)
      const res = await api.get(`/grade-space/grade/${grade}`)
      setAnnouncements(res.data)
    } catch (err) {
      setError('Failed to load grade space')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      const res = await api.post('/grade-space/create', {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        type: newAnnouncement.type,
        grade: grade
      })

      setAnnouncements([res.data.announcement, ...announcements])
      setNewAnnouncement({ title: '', content: '', type: 'announcement' })
      setShowForm(false)
      setMessage('Announcement posted successfully!')
    } catch (err) {
      console.error('Create announcement error:', err);
      setError(err?.response?.data?.message || err.message || 'Failed to create announcement')
    }
  }

  const handleAddComment = async (announcementId) => {
    if (!newComment.trim()) return

    try {
      const res = await api.post(`/grade-space/${announcementId}/comment`, {
        text: newComment
      })

      setAnnouncements(
        announcements.map((a) =>
          a._id === announcementId ? res.data.announcement : a
        )
      )
      setNewComment('')
      setSelectedAnnouncement(null)
      setMessage('Comment added!')
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to add comment')
    }
  }

  const handleLike = async (announcementId) => {
    try {
      const res = await api.post(`/grade-space/${announcementId}/like`)
      setAnnouncements(
        announcements.map((a) =>
          a._id === announcementId
            ? { ...a, likes: res.data.likes || a.likes }
            : a
        )
      )
    } catch (err) {
      console.error('Error liking announcement:', err)
    }
  }

  const handleDeleteAnnouncement = async (announcementId) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await api.delete(`/grade-space/${announcementId}`)
        setAnnouncements(announcements.filter((a) => a._id !== announcementId))
        setMessage('Announcement deleted')
      } catch (err) {
        setError('Failed to delete announcement')
      }
    }
  }

  return (
    <div className="grade-space">
      <nav className="space-navbar">
        <div className="nav-left">
          <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
          <h1>Grade Space - {grade}</h1>
        </div>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </nav>

      <div className="space-container">
        {isLoading && <div className="loading">⏳ Loading grade space...</div>}

        {(userRole === 'teacher' || userRole === 'parent') && (
          <>
            <button
              className="create-post-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Cancel' : '📢 New Post'}
            </button>

            {showForm && (
              <form onSubmit={handleCreateAnnouncement} className="create-form">
                <input
                  type="text"
                  placeholder="Announcement title"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  required
                />
                <textarea
                  placeholder="Announcement details"
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  required
                  rows="5"
                />
                <select
                  value={newAnnouncement.type}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, type: e.target.value })}
                >
                  <option value="announcement">Announcement</option>
                  <option value="alert">Alert</option>
                  <option value="event">Event</option>
                  <option value="general">General</option>
                </select>
                <button type="submit" className="submit-btn">Post Announcement</button>
              </form>
            )}
          </>
        )}

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="announcements-list">
          {announcements.length === 0 && !isLoading ? (
            <p className="no-data">No announcements yet. {userRole === 'teacher' && 'Make the first announcement!'}</p>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement._id} className="announcement-card">
                <div className="announcement-header">
                  <div className="header-left">
                    <div className="type-badge">{announcement.type}</div>
                    <div>
                      <h3>{announcement.title}</h3>
                      <p className="meta">
                        By {announcement.teacher?.name || announcement.parent?.name || 'Member'} •
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {((userRole === 'teacher' && announcement.teacher?._id === userId) || (userRole === 'parent' && announcement.parent?._id === userId) || userRole === 'admin') && (
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteAnnouncement(announcement._id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>

                <div className="announcement-content">
                  {announcement.content}
                </div>

                <div className="announcement-actions">
                  <button
                    className="like-btn"
                    onClick={() => handleLike(announcement._id)}
                  >
                    👍 {announcement.likes?.length || 0}
                  </button>
                  <span>{announcement.comments?.length || 0} Comments</span>
                </div>

                <div className="comments-section">
                  {announcement.comments?.map((comment) => (
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

                  {(userRole === 'parent' || userRole === 'teacher') && (
                    <>
                      {selectedAnnouncement === announcement._id ? (
                        <div className="add-comment">
                          <textarea
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows="3"
                          />
                          <div className="comment-actions">
                            <button
                              onClick={() => handleAddComment(announcement._id)}
                              className="add-btn"
                            >
                              Add Comment
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAnnouncement(null)
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
                          onClick={() => setSelectedAnnouncement(announcement._id)}
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
