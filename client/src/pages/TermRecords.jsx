import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { normalizeTerm, termLabel, filterRecordsByTerm, exportTermRecordsPdf, exportClassTermRecordsPdf } from '../lib/recordUtils'
import '../styles/TermRecords.css'

export default function TermRecords({ userRole, teacherId, parentId, onLogout }) {
  const { studentId, term } = useParams()
  const navigate = useNavigate()
  const [currentTerm, setCurrentTerm] = useState(1)
  const [student, setStudent] = useState(null)
  const [classStudents, setClassStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newRecord, setNewRecord] = useState({ subject:'', score:'', remarks:'' })
  const [editTarget, setEditTarget] = useState(null)
  const [editValues, setEditValues] = useState({ subject:'', score:'', remarks:'' })

  useEffect(() => {
    try {
      setError('')
      setCurrentTerm(normalizeTerm(term))
    } catch (err) {
      setError(err.message)
    }
  }, [term])

  useEffect(() => {
    if (!term) return
    fetchData()
  }, [term, studentId, currentTerm])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (studentId) {
        const res = await api.get(`/students/${studentId}/term/${currentTerm}`)
        setStudent(res.data.student)
        setClassStudents([])
      } else {
        const res = await api.get(`/teachers/${teacherId}/students`)
        const students = res.data.students || []
        const mapped = students.map((s) => ({
          ...s,
          termRecords: filterRecordsByTerm(s.academicRecords || [], currentTerm)
        }))
        setClassStudents(mapped)
        setStudent(null)
      }
    } catch (err) {
      console.error('Term records fetch error:', err)
      setError(err?.response?.data?.message || err.message || 'Unable to load term records')
    } finally {
      setLoading(false)
    }
  }

  const handleTermClick = (termValue) => {
    if (studentId) {
      navigate(`/student/${studentId}/term/${termValue}`)
    } else {
      navigate(`/term-records/${termValue}`)
    }
  }

  const handleDownload = () => {
    if (!student) return
    const records = filterRecordsByTerm(student.academicRecords || [], currentTerm)
    if (records.length === 0) {
      alert('No records to download for this term.')
      return
    }
    exportTermRecordsPdf(student, records, currentTerm)
  }

  const handleClassDownload = () => {
    if (classStudents.length === 0) {
      alert('No class records to download.')
      return
    }
    exportClassTermRecordsPdf(classStudents, currentTerm)
  }

  const handleAddRecord = async () => {
    if (!studentId) return
    if (!newRecord.subject.trim()) {
      alert('Please enter a subject.')
      return
    }
    try {
      await api.post(`/students/${studentId}/academic-records`, {
        term: currentTerm,
        subject: newRecord.subject,
        score: Number(newRecord.score),
        remarks: newRecord.remarks
      })
      setNewRecord({ subject:'', score:'', remarks:'' })
      fetchData()
    } catch (err) {
      console.error('Add record error:', err)
      alert(err?.response?.data?.message || err.message || 'Unable to add record')
    }
  }

  const startEdit = (studentIdValue, record) => {
    setEditTarget({ studentId: studentIdValue, recordId: record._id })
    setEditValues({ subject: record.subject || '', score: record.score || '', remarks: record.remarks || '' })
  }

  const cancelEdit = () => {
    setEditTarget(null)
    setEditValues({ subject:'', score:'', remarks:'' })
  }

  const handleSaveEdit = async () => {
    if (!editTarget) return
    if (!editValues.subject.trim()) {
      alert('Subject is required.')
      return
    }
    try {
      await api.put(`/students/${editTarget.studentId}/academic-records/${editTarget.recordId}`, {
        term: currentTerm,
        subject: editValues.subject,
        score: Number(editValues.score),
        remarks: editValues.remarks
      })
      cancelEdit()
      fetchData()
    } catch (err) {
      console.error('Save edit error:', err)
      alert(err?.response?.data?.message || err.message || 'Unable to update record')
    }
  }

  const handleDelete = async (studentIdValue, recordId) => {
    if (!window.confirm('Delete this academic record?')) return
    try {
      await api.delete(`/students/${studentIdValue}/academic-records/${recordId}`)
      fetchData()
    } catch (err) {
      console.error('Delete record error:', err)
      alert(err?.response?.data?.message || err.message || 'Unable to delete record')
    }
  }

  const termButtons = [1, 2, 3].map((t) => (
    <button key={t} className={currentTerm === t ? 'term-btn term-btn--active' : 'term-btn'} onClick={() => handleTermClick(t)}>
      Term {t}
    </button>
  ))

  return (
    <div className="term-page">
      <div className="term-header">
        <div>
          <h1>Term Records</h1>
          <p>{studentId ? 'Student-specific term records' : 'Class term records for teachers'}</p>
        </div>
        <div className="term-action-group">
          <button className="btn-secondary" onClick={() => navigate(userRole === 'teacher' ? '/teacher-dashboard' : '/parent-dashboard')}>
            Back
          </button>
          <button className="btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="term-panel">
        <div className="term-navigation-group">
          <div className="term-buttons">{termButtons}</div>
          {studentId && (
            <button className="btn-primary" onClick={handleDownload}>
              Download PDF
            </button>
          )}
          {!studentId && classStudents.length > 0 && (
            <button className="btn-primary" onClick={handleClassDownload}>
              Download Class PDF
            </button>
          )}
        </div>

        {loading && <p className="empty-state">Loading records...</p>}
        {error && <p className="empty-state" style={{ color: 'var(--danger)' }}>{error}</p>}

        {!loading && !error && studentId && student && (
          <div className="term-section">
            <div className="term-card">
              <div className="record-row">
                <div>
                  <div className="record-label">Student</div>
                  <h2 className="record-title">{student.name}</h2>
                  <div className="record-meta">Grade: {student.grade}</div>
                </div>
                <div>
                  <div className="status-pill">{termLabel(currentTerm)}</div>
                  <div className="record-meta" style={{ marginTop: 8 }}>{student.academicRecords?.length || 0} record(s)</div>
                </div>
              </div>
            </div>

            <div className="term-section">
              {student.academicRecords?.length === 0 ? (
                <div className="empty-state">No records for this term.</div>
              ) : (
                student.academicRecords?.map((record) => (
                  <div key={record._id} className="record-card">
                    {editTarget?.recordId === record._id && editTarget?.studentId === studentId ? (
                      <div className="record-form">
                        <input value={editValues.subject} onChange={(e) => setEditValues({ ...editValues, subject: e.target.value })} placeholder="Subject" />
                        <input value={editValues.score} onChange={(e) => setEditValues({ ...editValues, score: e.target.value })} placeholder="Score" type="number" />
                        <textarea value={editValues.remarks} onChange={(e) => setEditValues({ ...editValues, remarks: e.target.value })} placeholder="Remarks" />
                        <div className="action-group">
                          <button className="btn-primary" onClick={handleSaveEdit}>Save</button>
                          <button className="btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="record-row">
                        <div className="record-content">
                          <div className="record-title">{record.subject}</div>
                          <div className="record-meta">Score: {record.score || 'N/A'}</div>
                          <div className="record-meta">{record.remarks || 'No remarks'}</div>
                        </div>
                        {userRole === 'teacher' && (
                          <div className="card-actions">
                            <button className="btn-secondary" onClick={() => startEdit(studentId, record)}>Edit</button>
                            <button className="btn-primary" style={{ background: 'var(--danger)' }} onClick={() => handleDelete(studentId, record._id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {userRole === 'teacher' && (
              <div className="term-section">
                <div className="term-card">
                  <div className="record-row" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <div className="record-label">Add record</div>
                      <div className="record-meta">Add a new academic record for {termLabel(currentTerm)}</div>
                    </div>
                  </div>
                  <div className="record-form">
                    <input value={newRecord.subject} onChange={(e) => setNewRecord({ ...newRecord, subject: e.target.value })} placeholder="Subject" />
                    <input value={newRecord.score} onChange={(e) => setNewRecord({ ...newRecord, score: e.target.value })} placeholder="Score" type="number" />
                    <textarea value={newRecord.remarks} onChange={(e) => setNewRecord({ ...newRecord, remarks: e.target.value })} placeholder="Remarks" />
                    <div className="action-group">
                      <button className="btn-primary" onClick={handleAddRecord}>Add Record</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !studentId && (
          <div className="term-section">
            {classStudents.length === 0 ? (
              <div className="empty-state">No class records available for this term.</div>
            ) : (
              classStudents.map((s) => (
                <div key={s._id} className="student-card">
                  <div className="record-row" style={{ marginBottom: 10 }}>
                    <div>
                      <div className="record-title">{s.name}</div>
                      <div className="record-meta">Grade {s.grade}</div>
                    </div>
                    <div className="card-actions">
                      <button className="btn-secondary" onClick={() => navigate(`/student/${s._id}/term/${currentTerm}`)}>Student view</button>
                      {s.termRecords.length > 0 && (
                        <button className="btn-primary" onClick={() => exportTermRecordsPdf(s, s.termRecords, currentTerm)}>Download</button>
                      )}
                    </div>
                  </div>

                  {s.termRecords.length === 0 ? (
                    <div className="empty-state">No records for this term.</div>
                  ) : (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {s.termRecords.map((record) => (
                        <div key={record._id} className="record-card">
                          <div className="record-row">
                            <div className="record-content">
                              <div className="record-title">{record.subject}</div>
                              <div className="record-meta">Score: {record.score || 'N/A'}</div>
                              <div className="record-meta">{record.remarks || 'No remarks'}</div>
                            </div>
                            <div className="card-actions">
                              <button className="btn-secondary" onClick={() => navigate(`/student/${s._id}/term/${currentTerm}`)}>View</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
