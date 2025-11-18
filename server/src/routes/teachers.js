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

// Teacher adds parent and student (with max 2 parents per student enforced)
router.post('/:teacherId/add-parent-student', auth(['teacher']), async (req, res) => {
  try {
    const { parent, student, existingStudentId } = req.body;
    if (!parent || !parent.name) return res.status(400).json({ message: 'Parent data required (name, contact)' });
    if (!student || !student.uniqueID || !student.name) return res.status(400).json({ message: 'Student data required (uniqueID, name)' });

    // Auto-generate parent uniqueID if not provided
    const parentUniqueID = parent.uniqueID || `P_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let studentDoc;
    if (existingStudentId) {
      // Add parent to existing student
      studentDoc = await Student.findById(existingStudentId);
      if (!studentDoc) return res.status(404).json({ message: 'Student not found' });
      if (studentDoc.parentIDs.length >= 2) return res.status(400).json({ message: 'Student already has 2 parents (max limit)' });
      // create or fetch parent
      let parentDoc = await Parent.findOne({ uniqueID: parentUniqueID });
      if (!parentDoc) {
        parentDoc = await Parent.create({ uniqueID: parentUniqueID, name: parent.name, contact: parent.contact });
        const username = `p_${parent.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 100)}`;
        const password = (Math.random() + 1).toString(36).substring(7);
        const hash = await bcrypt.hash(password, 10);
        await User.create({ role: 'parent', username, password: hash, refId: parentDoc._id, roleRef: 'Parent' });
      }
      studentDoc.parentIDs.push(parentDoc._id);
      if (!studentDoc.parentsContact.includes(parent.contact)) studentDoc.parentsContact.push(parent.contact);
      await studentDoc.save();
      if (!parentDoc.childIDs.includes(studentDoc._id)) { parentDoc.childIDs.push(studentDoc._id); await parentDoc.save(); }
      return res.json({ message: 'Parent added to student', student: studentDoc, parentId: parentDoc._id });
    } else {
      // Create new parent and student
      const parentDoc = await Parent.create({ uniqueID: parentUniqueID, name: parent.name, contact: parent.contact });
      studentDoc = await Student.create({ uniqueID: student.uniqueID, name: student.name, grade: student.grade, homeLocation: student.homeLocation, parentIDs: [parentDoc._id], parentsContact: [parent.contact] });
      parentDoc.childIDs.push(studentDoc._id);
      await parentDoc.save();
      // Auto-generate username from parent name (simple format)
      const username = `p_${parent.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 100)}`;
      const password = (Math.random() + 1).toString(36).substring(7);
      const hash = await bcrypt.hash(password, 10);
      const userDoc = await User.create({ role: 'parent', username, password: hash, refId: parentDoc._id, roleRef: 'Parent' });
      console.log(`Created parent user: ${username}, role: ${userDoc.role}`);
      res.json({ message: 'Parent and student created', parent: parentDoc, student: studentDoc, credentials: { username, password } });
    }
  } catch (err) {
    console.error(err);
    if (err.message.includes('duplicate')) return res.status(400).json({ message: 'Parent already exists' });
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

// Get teacher details
router.get('/:teacherId', auth(['teacher', 'parent']), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.teacherId);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    // find associated user account
    const user = await User.findOne({ refId: teacher._id, roleRef: 'Teacher' }).select('_id username');
    res.json({ teacher, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teachers by grade (useful for parents to find student's teacher)
router.get('/grade/:grade', auth(['teacher','parent']), async (req, res) => {
  try {
    const grade = req.params.grade;
    const teachers = await Teacher.find({ grade });
    // attach user id for each teacher
    const results = await Promise.all(teachers.map(async (t) => {
      const user = await User.findOne({ refId: t._id, roleRef: 'Teacher' }).select('_id username');
      return { teacher: t, user };
    }));
    res.json({ teachers: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
