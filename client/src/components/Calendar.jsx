import React, { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { api } from '../lib/api'
import '../styles/Calendar.css'

export default function EventCalendar({ userRole, userId }) {
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    type: 'meeting',
    visibility: 'public',
    grade: '',
    studentIds: []
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events')
      setEvents(res.data.events || [])
    } catch (err) {
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    const dateStr = date.toISOString().split('T')[0]
    const dayEvents = events.filter(event =>
      event.date.split('T')[0] === dateStr
    )
    setSelectedEvents(dayEvents)
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    try {
      const eventData = {
        ...newEvent,
        date: selectedDate.toISOString().split('T')[0]
      }

      await api.post('/events', eventData)
      setNewEvent({
        title: '',
        description: '',
        date: '',
        startTime: '',
        endTime: '',
        type: 'meeting',
        visibility: 'public',
        grade: '',
        studentIds: []
      })
      setShowEventForm(false)
      fetchEvents()
    } catch (err) {
      console.error('Error creating event:', err)
      alert('Failed to create event: ' + (err?.response?.data?.message || err.message))
    }
  }

  const getEventTypeColor = (type) => {
    const colors = {
      meeting: '#667eea',
      school_event: '#f093fb',
      assignment: '#f5576c',
      holiday: '#4ecdc4',
      reminder: '#45b7d1',
      other: '#96ceb4'
    }
    return colors[type] || colors.other
  }

  const getVisibilityLabel = (visibility) => {
    const labels = {
      public: 'Public',
      teachers_only: 'Teachers Only',
      parents_only: 'Parents Only',
      class_specific: 'Class Specific'
    }
    return labels[visibility] || visibility
  }

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0]
      const dayEvents = events.filter(event =>
        event.date.split('T')[0] === dateStr
      )

      if (dayEvents.length > 0) {
        return (
          <div className="calendar-event-indicators">
            {dayEvents.slice(0, 3).map((event, index) => (
              <div
                key={event._id}
                className="event-dot"
                style={{ backgroundColor: getEventTypeColor(event.type) }}
                title={event.title}
              />
            ))}
            {dayEvents.length > 3 && <span className="more-events">+{dayEvents.length - 3}</span>}
          </div>
        )
      }
    }
    return null
  }

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>
  }

  return (
    <div className="event-calendar">
      <div className="calendar-header">
        <h3>School Calendar</h3>
        <button
          className="btn-primary"
          onClick={() => setShowEventForm(true)}
        >
          Add Event
        </button>
      </div>

      <div className="calendar-content">
        <div className="calendar-main">
          <Calendar
            onChange={handleDateClick}
            value={selectedDate}
            tileContent={tileContent}
            className="react-calendar"
          />
        </div>

        <div className="calendar-sidebar">
          <div className="selected-date-info">
            <h4>{selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</h4>

            {selectedEvents.length === 0 ? (
              <p className="no-events">No events on this date</p>
            ) : (
              <div className="events-list">
                {selectedEvents.map(event => (
                  <div key={event._id} className="event-item">
                    <div
                      className="event-color"
                      style={{ backgroundColor: getEventTypeColor(event.type) }}
                    />
                    <div className="event-details">
                      <h5>{event.title}</h5>
                      {event.startTime && event.endTime && (
                        <p className="event-time">
                          {event.startTime} - {event.endTime}
                        </p>
                      )}
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      <p className="event-meta">
                        <span className="event-type">{event.type.replace('_', ' ')}</span>
                        <span className="event-visibility">{getVisibilityLabel(event.visibility)}</span>
                      </p>
                      <p className="event-creator">
                        Created by {event.createdBy.userType}: {event.createdBy.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEventForm && (
        <div className="event-form-overlay">
          <div className="event-form">
            <h3>Add New Event</h3>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({...newEvent, startTime: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({...newEvent, endTime: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                  >
                    <option value="meeting">Meeting</option>
                    <option value="school_event">School Event</option>
                    <option value="assignment">Assignment</option>
                    <option value="holiday">Holiday</option>
                    <option value="reminder">Reminder</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Visibility</label>
                  <select
                    value={newEvent.visibility}
                    onChange={(e) => setNewEvent({...newEvent, visibility: e.target.value})}
                  >
                    <option value="public">Public</option>
                    <option value="teachers_only">Teachers Only</option>
                    <option value="parents_only">Parents Only</option>
                    <option value="class_specific">Class Specific</option>
                  </select>
                </div>
              </div>

              {newEvent.visibility === 'class_specific' && (
                <div className="form-group">
                  <label>Grade</label>
                  <select
                    value={newEvent.grade}
                    onChange={(e) => setNewEvent({...newEvent, grade: e.target.value})}
                    required
                  >
                    <option value="">Select Grade</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                  </select>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowEventForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}