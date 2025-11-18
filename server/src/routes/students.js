const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const User = require('../models/User');
const auth = require('../middleware/auth');

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
    console.error(err);
    res.status(500).json({ message: 'Server error' });
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
      student.academicRecords.push(...academicRecords);
    }
    student = await student.save();
    res.json({ student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get parent's children
router.get('/parent/:parentId', auth(['parent']), async (req, res) => {
  try {
    const parent = await Parent.findById(req.params.parentId).populate('childIDs');
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    res.json({ children: parent.childIDs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
