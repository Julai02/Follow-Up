const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const User = require('../models/User');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Create teacher (for seed/admin use) - admin only in future
router.post('/', async (req, res) => {
  try {
    const { uniqueID, name, contact, grade, subject } = req.body;
    const teacher = await Teacher.create({ uniqueID, name, contact, grade, subject });
    // create user account for teacher
    const username = `t_${uniqueID}`;
    const password = (Math.random() + 1).toString(36).substring(7);
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ role: 'teacher', username, password: hash, refId: teacher._id, roleRef: 'Teacher' });
    res.json({ teacher, credentials: { username, password } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating teacher' });
  }
});

// Teacher adds parent and student
router.post('/:teacherId/add-parent-student', auth(['teacher']), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { parent, student } = req.body; // parent: {uniqueID,name,contact}, student: {uniqueID,name,grade,homeLocation}
    // create parent
    const parentDoc = await Parent.create({ uniqueID: parent.uniqueID, name: parent.name, contact: parent.contact });
    // create student and link parent
    const studentDoc = await Student.create({ uniqueID: student.uniqueID, name: student.name, grade: student.grade, homeLocation: student.homeLocation, parentIDs: [parentDoc._id], parentsContact: [parent.contact] });
    // link child to parent
    parentDoc.childIDs.push(studentDoc._id);
    await parentDoc.save();
    // create parent user credentials
    const username = `p_${parent.uniqueID}`;
    const password = (Math.random() + 1).toString(36).substring(7);
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ role: 'parent', username, password: hash, refId: parentDoc._id, roleRef: 'Parent' });

    res.json({ parent: parentDoc, student: studentDoc, credentials: { username, password } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating parent/student' });
  }
});

// Get students for a teacher's grade
router.get('/:teacherId/students', auth(['teacher']), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    const students = await Student.find({ grade: teacher.grade }).populate('parentIDs');
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
