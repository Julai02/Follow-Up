export const normalizeTerm = (term) => {
  if (typeof term === 'string') {
    const cleaned = term.trim().toLowerCase().replace(/^term\s*/i, '')
    const parsed = Number(cleaned)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
      throw new Error('Term must be 1, 2, or 3')
    }
    return parsed
  }
  if (typeof term === 'number') {
    if (!Number.isInteger(term) || term < 1 || term > 3) {
      throw new Error('Term must be 1, 2, or 3')
    }
    return term
  }
  throw new Error('Term must be 1, 2, or 3')
}

export const termLabel = (term) => {
  const normalized = normalizeTerm(term)
  return `Term ${normalized}`
}

import jsPDF from 'jspdf'

export const filterRecordsByTerm = (records = [], term) => {
  let normalized
  try {
    normalized = normalizeTerm(term)
  } catch {
    return []
  }

  return (records || []).filter((record) => {
    try {
      return normalizeTerm(record.term) === normalized
    } catch {
      return false
    }
  })
}

export const exportTermRecordsPdf = (student, records, term) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  const termLabelValue = termLabel(term)

  doc.setFontSize(20)
  doc.text('Academic Records', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text('Student Information', 20, yPos)
  yPos += 8

  doc.setFont(undefined, 'normal')
  doc.setFontSize(11)
  doc.text(`Name: ${student?.name || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`ID: ${student?.uniqueID || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`Grade: ${student?.grade || 'N/A'}`, 20, yPos)
  yPos += 6
  doc.text(`${termLabelValue}`, 20, yPos)
  yPos += 10

  doc.setFont(undefined, 'bold')
  doc.setFontSize(11)
  doc.text('Subject', 20, yPos)
  doc.text('Score', 90, yPos)
  doc.text('Remarks', 130, yPos)
  yPos += 8

  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  doc.setDrawColor(200)
  doc.line(20, yPos - 1, pageWidth - 20, yPos - 1)

  records.forEach((record) => {
    if (yPos > pageHeight - 30) {
      doc.addPage()
      yPos = 20
      doc.setFont(undefined, 'bold')
      doc.text('Subject', 20, yPos)
      doc.text('Score', 90, yPos)
      doc.text('Remarks', 130, yPos)
      yPos += 8
      doc.setFont(undefined, 'normal')
    }

    doc.text(record.subject || 'N/A', 20, yPos)
    doc.text(String(record.score || 'N/A'), 90, yPos)
    doc.text(record.remarks || 'N/A', 130, yPos)
    yPos += 6
  })

  yPos += 5
  doc.setFontSize(9)
  doc.setFont(undefined, 'italic')
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  const fileName = `${student?.name?.replace(/\s+/g, '_') || 'student'}_${termLabelValue}_Records.pdf`
  doc.save(fileName)
}

export const exportClassTermRecordsPdf = (students, term) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  const termLabelValue = termLabel(term)

  // Collect all unique subjects and prepare student data
  const subjectSet = new Set()
  const studentData = students.map(student => {
    const records = filterRecordsByTerm(student.academicRecords || [], term)
    const subjectScores = {}

    records.forEach(record => {
      if (record.subject) {
        subjectSet.add(record.subject)
        subjectScores[record.subject] = record.score || 'N/A'
      }
    })

    return {
      name: student.name || 'N/A',
      grade: student.grade || 'N/A',
      subjectScores
    }
  })

  const subjects = Array.from(subjectSet).sort()

  // Check if all students are from the same grade
  const grades = [...new Set(studentData.map(s => s.grade))]
  const commonGrade = grades.length === 1 ? grades[0] : null

  // Main title: Grade X Results or Class Results
  let mainTitle = 'Class Results'
  if (commonGrade) {
    // Check if grade already contains "Grade" prefix
    const gradePrefix = commonGrade.toLowerCase().startsWith('grade') ? '' : 'Grade '
    mainTitle = `${gradePrefix}${commonGrade} Results`
  }

  doc.setFontSize(20)
  doc.text(mainTitle, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Subtitle: Term label
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(termLabelValue, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Calculate column widths (removed grade column)
  const nameWidth = 70
  const subjectWidth = Math.max(25, (pageWidth - 40 - nameWidth) / subjects.length)

  // Header
  doc.setFontSize(11)
  doc.setFont(undefined, 'bold')
  let xPos = 20

  doc.text('Student Name', xPos, yPos)
  xPos += nameWidth

  subjects.forEach(subject => {
    if (xPos + subjectWidth > pageWidth - 20) {
      // If we run out of space, we'll need to handle this differently
      // For now, just truncate or wrap
    }
    doc.text(subject.length > 8 ? subject.substring(0, 8) + '...' : subject, xPos, yPos)
    xPos += subjectWidth
  })

  yPos += 8

  // Draw header line
  doc.setDrawColor(200)
  doc.line(20, yPos - 1, pageWidth - 20, yPos - 1)

  // Student rows
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)

  studentData.forEach((student, index) => {
    if (yPos > pageHeight - 20) {
      doc.addPage()
      yPos = 20
      // Redraw header on new page
      doc.setFont(undefined, 'bold')
      doc.setFontSize(11)
      xPos = 20
      doc.text('Student Name', xPos, yPos)
      xPos += nameWidth
      subjects.forEach(subject => {
        doc.text(subject.length > 8 ? subject.substring(0, 8) + '...' : subject, xPos, yPos)
        xPos += subjectWidth
      })
      yPos += 8
      doc.line(20, yPos - 1, pageWidth - 20, yPos - 1)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
    }

    xPos = 20

    // Student name
    doc.text(student.name.length > 20 ? student.name.substring(0, 20) + '...' : student.name, xPos, yPos)
    xPos += nameWidth

    // Subject scores (removed grade column)
    subjects.forEach(subject => {
      const score = student.subjectScores[subject] || '-'
      doc.text(String(score), xPos, yPos)
      xPos += subjectWidth
    })

    yPos += 6
  })

  yPos += 5
  doc.setFontSize(9)
  doc.setFont(undefined, 'italic')
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' })

  const fileName = `Class_${termLabelValue}_Records.pdf`
  doc.save(fileName)
}
