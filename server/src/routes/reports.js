const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const Student = require('../models/Student');
const Term = require('../models/Term');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

// Get all terms
router.get('/terms', auth(), async (req, res) => {
  try {
    const terms = await Term.find().sort({ year: -1, termNumber: -1 });
    res.json(terms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current/active term
router.get('/terms/active', auth(), async (req, res) => {
  try {
    const activeTerm = await Term.findOne({ isActive: true });
    if (!activeTerm) {
      return res.status(404).json({ message: 'No active term found' });
    }
    res.json(activeTerm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student report by term (for parents)
router.get('/student/:studentId/term/:termId', auth(), async (req, res) => {
  try {
    const { studentId, termId } = req.params;

    // Verify parent is viewing their own child
    if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId);
      if (!parent.childIDs.includes(studentId)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    // Get academic records for this term
    const termRecords = student.academicRecords.filter(
      record => record.term === term._id.toString()
    );

    res.json({
      student,
      term,
      academicRecords: termRecords
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download term report as PDF
router.get('/download/:studentId/term/:termId', auth(), async (req, res) => {
  try {
    const { studentId, termId } = req.params;

    // Verify authorization
    if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId);
      if (!parent.childIDs.includes(studentId)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.refId);
      // Teacher can only download if they teach this student's class
      const student = await Student.findById(studentId);
      if (!teacher.grades.includes(student.grade)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    // Get academic records for this term
    const termRecords = student.academicRecords.filter(
      record => record.term === term._id.toString()
    );

    // Create PDF
    const doc = new PDFDocument();
    const filename = `${student.name}-${term.name}-Report.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('FOLLOW-UP ACADEMIC REPORT', { align: 'center' });
    doc.fontSize(10).text(term.name, { align: 'center' });
    doc.moveDown();

    // Student Information
    doc.fontSize(12).font('Helvetica-Bold').text('STUDENT INFORMATION');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Name: ${student.name}`);
    doc.text(`Grade: ${student.grade}`);
    doc.text(`ID: ${student.uniqueID}`);
    doc.text(`Term: ${term.name} (${term.startDate.toDateString()} - ${term.endDate.toDateString()})`);
    doc.moveDown();

    // Academic Records Table
    doc.fontSize(12).font('Helvetica-Bold').text('ACADEMIC PERFORMANCE');
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const colWidth = 120;
    const rowHeight = 20;
    let yPosition = tableTop;

    // Table headers
    const headers = ['Subject', 'Score (100)', 'Grade', 'Remarks'];
    doc.fontSize(10).font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, 50 + i * colWidth, yPosition);
    });

    yPosition += rowHeight;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Table rows
    doc.font('Helvetica').fontSize(9);
    termRecords.forEach(record => {
      const subject = record.subject || 'N/A';
      const score = record.score || '-';
      const grade = calculateGrade(record.score);
      const remarks = record.remarks || '-';

      doc.text(subject, 50, yPosition);
      doc.text(score, 170, yPosition);
      doc.text(grade, 290, yPosition);
      doc.text(remarks, 410, yPosition);

      yPosition += rowHeight;
    });

    // Summary
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 10;

    const avgScore = termRecords.length > 0
      ? (termRecords.reduce((sum, r) => sum + (r.score || 0), 0) / termRecords.length).toFixed(2)
      : 0;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Average Score: ${avgScore}`);
    doc.text(`Total Subjects: ${termRecords.length}`);

    // Footer
    doc.moveDown();
    doc.fontSize(9).font('Helvetica').text('Generated by Follow-Up System', { align: 'center' });
    doc.text(new Date().toDateString(), { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get class report by term (for teachers)
router.get('/class/:grade/term/:termId', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { grade, termId } = req.params;

    const term = await Term.findById(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }

    // Get all students in this grade
    const students = await Student.find({ grade });

    // Get their academic records for this term
    const classReport = students.map(student => {
      const termRecords = student.academicRecords.filter(
        record => record.term === term._id.toString()
      );
      const avgScore = termRecords.length > 0
        ? (termRecords.reduce((sum, r) => sum + (r.score || 0), 0) / termRecords.length).toFixed(2)
        : 0;

      return {
        student: {
          id: student._id,
          name: student.name,
          grade: student.grade
        },
        averageScore: avgScore,
        totalSubjects: termRecords.length,
        records: termRecords
      };
    });

    res.json({
      grade,
      term,
      students: classReport
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to calculate grade based on CBC (Kenyan Curriculum)
function calculateGrade(score) {
  if (!score) return '-';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

module.exports = router;
