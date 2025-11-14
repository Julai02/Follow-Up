const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const auth = require('../middleware/auth');

// Get single student
router.get('/:id', auth(['teacher','parent']), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('parentIDs');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update student records - teacher only
router.put('/:id', auth(['teacher']), async (req, res) => {
  try {
    const updates = req.body;
    const student = await Student.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
