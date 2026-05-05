const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const User = require('../models/User');
const auth = require('../middleware/auth');

const normalizeTerm = (term) => {
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

const normalizeAcademicRecord = (record) => {
  if (!record || typeof record !== 'object') {
    throw new Error('Academic record must be an object')
  }
  const { term, subject, score, remarks, date } = record
  return {
    term: normalizeTerm(term),
    subject: subject || '',
    score: score !== undefined ? Number(score) : undefined,
    remarks: remarks || '',
    date: date ? new Date(date) : undefined
  }
}

const normalizeAcademicRecords = (records) => {
  if (!Array.isArray(records)) return []
  return records.map((record) => {
    try {
      return normalizeAcademicRecord(record)
    } catch (err) {
      return record
    }
  })
}

// Get single student
router.get('/:id', auth(['teacher','parent']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('parentIDs');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Also attach User IDs for each parent (needed for messaging)
    const parentIdsWithUsers = await Promise.all(student.parentIDs.map(async (parent) => {
      const user = await User.findOne({ refId: parent._id, roleRef: 'Parent' }).select('_id');
      return { ...parent.toObject(), userId: user?._id };
    }));
    const enrichedStudent = student.toObject();
    enrichedStudent.parentIDs = parentIdsWithUsers;
    res.json({ student: enrichedStudent });
  } catch (err) {
    console.error('Error fetching student:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid student ID format' });
    res.status(500).json({ message: 'Failed to load student: ' + err.message });
  }
});

// Get student records by term (parent or teacher)
router.get('/:id/term/:term', auth(['teacher','parent']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('parentIDs');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    let term;
    try {
      term = normalizeTerm(req.params.term);
    } catch (normalizeErr) {
      return res.status(400).json({ message: normalizeErr.message });
    }

    const studentObj = student.toObject();
    studentObj.academicRecords = (studentObj.academicRecords || []).filter(r => r.term === term);

    const parentIdsWithUsers = await Promise.all(student.parentIDs.map(async (parent) => {
      const user = await User.findOne({ refId: parent._id, roleRef: 'Parent' }).select('_id');
      return { ...parent.toObject(), userId: user?._id };
    }));
    studentObj.parentIDs = parentIdsWithUsers;

    res.json({ student: studentObj });
  } catch (err) {
    console.error('Error fetching student term:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid student ID format' });
    res.status(500).json({ message: 'Failed to load student term data: ' + err.message });
  }
});

// Add a single academic record - appends to existing records
router.post('/:id/academic-records', auth(['teacher']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.academicRecords = normalizeAcademicRecords(student.academicRecords);
    const record = normalizeAcademicRecord(req.body);
    student.academicRecords.push(record);
    await student.save();
    res.json({ student });
  } catch (err) {
    console.error('Error adding academic record:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid student ID format' });
    res.status(400).json({ message: err.message });
  }
});

// Update a single academic record - teacher only
router.put('/:id/academic-records/:recordId', auth(['teacher']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.academicRecords = normalizeAcademicRecords(student.academicRecords);
    const record = student.academicRecords.id(req.params.recordId);
    if (!record) return res.status(404).json({ message: 'Academic record not found' });

    const normalized = normalizeAcademicRecord(req.body);
    record.term = normalized.term;
    record.subject = normalized.subject;
    record.score = normalized.score;
    record.remarks = normalized.remarks;
    if (normalized.date) record.date = normalized.date;

    await student.save();
    res.json({ student });
  } catch (err) {
    console.error('Error updating academic record:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid student ID format' });
    res.status(400).json({ message: err.message });
  }
});

// Delete a single academic record - teacher only
router.delete('/:id/academic-records/:recordId', auth(['teacher']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const record = student.academicRecords.id(req.params.recordId);
    if (!record) return res.status(404).json({ message: 'Academic record not found' });

    record.remove();
    await student.save();
    res.json({ student });
  } catch (err) {
    console.error('Error deleting academic record:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid student ID format' });
    res.status(500).json({ message: err.message });
  }
});

// Update student records - teacher only
router.put('/:id', auth(['teacher']), async (req, res) => {
  try {
    const { academicRecords, ...otherUpdates } = req.body;
    let student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    Object.assign(student, otherUpdates);
    if (academicRecords) {
      if (!Array.isArray(academicRecords)) return res.status(400).json({ message: 'academicRecords must be array' });
      const normalizedRecords = academicRecords.map(record => {
        if (!record || typeof record !== 'object') throw new Error('Each academic record must be an object');
        const { term, subject, score, remarks, date } = record;
        const normalizedTerm = normalizeTerm(term);
        return {
          term: normalizedTerm,
          subject,
          score,
          remarks,
          date: date ? new Date(date) : undefined
        };
      });
      student.academicRecords = normalizedRecords;
    }
    student = await student.save();
    res.json({ student });
  } catch (err) {
    console.error('Error updating student:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid student ID format' });
    if (err.message.includes('validation')) return res.status(400).json({ message: 'Invalid data: ' + err.message });
    res.status(500).json({ message: 'Failed to update student: ' + err.message });
  }
});

// Get parent's children (with teacher user IDs for messaging)
router.get('/parent/:parentId', auth(['parent']), async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.parentId).populate('childIDs');
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    
    // Enrich each child with their teachers for easier access
    const Teacher = require('../models/Teacher');
    const enrichedChildren = await Promise.all(parent.childIDs.map(async (child) => {
      const teachers = await Teacher.find({ grade: child.grade });
      const enrichedTeachers = await Promise.all(teachers.map(async (teacher) => {
        const user = await User.findOne({ refId: teacher._id, roleRef: 'Teacher' }).select('_id');
        return { ...teacher.toObject(), userId: user?._id };
      }));
      const enrichedChild = child.toObject();
      enrichedChild.teachers = enrichedTeachers;
      return enrichedChild;
    }));
    
    res.json({ children: enrichedChildren });
  } catch (err) {
    console.error('Error fetching parent children:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid parent ID format' });
    res.status(500).json({ message: 'Failed to load children: ' + err.message });
  }
});

module.exports = router;
