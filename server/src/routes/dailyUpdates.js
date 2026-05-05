const express = require('express');
const router = express.Router();
const DailyUpdate = require('../models/DailyUpdate');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Debug middleware to log incoming requests to this router
router.use((req, res, next) => {
  try {
    console.log(`[DailyUpdates DEBUG] ${req.method} ${req.path} Authorization: ${!!req.headers.authorization}`);
  } catch (e) { /* ignore */ }
  next();
});

// Get all updates for a grade (visible only to parents and teachers of that grade)
router.get('/grade/:grade', auth(), async (req, res) => {
  try {
    const { grade } = req.params;

    // Verify user has access to this grade
    if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId).populate('childIDs');
      const parentGrades = parent.childIDs.map(child => child.grade);
      if (!parentGrades.includes(grade)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.refId);
      // Accept teacher.grades array or legacy teacher.grade/classTeacherGrade
      const normalizeGrade = (g) => String(g || '').toLowerCase().replace(/\s+/g, '').replace(/^grade/, '');
      const requested = normalizeGrade(grade);
      const teacherGrades = (teacher.grades || []).map(normalizeGrade);
      if (teacher.grade) teacherGrades.push(normalizeGrade(teacher.grade));
      if (teacher.classTeacherGrade) teacherGrades.push(normalizeGrade(teacher.classTeacherGrade));
      if (!teacherGrades.includes(requested)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const updates = await DailyUpdate.find({
      'visibility.grade': grade,
      isPublished: true
    })
      .populate('teacher', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(updates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create daily update (only teachers can create)
router.post('/create', auth(), async (req, res) => {
  try {
    console.log('[DailyUpdate CREATE] User:', req.user);
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create updates' });
    }

    const { title, content, category, grade } = req.body;
    console.log('[DailyUpdate CREATE] Payload:', { title, content, category, grade });

    if (!title || !content || !grade) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const teacher = await Teacher.findById(req.user.refId);
    console.log('[DailyUpdate CREATE] Teacher found:', teacher);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    // Normalize grade comparison to accept both "Grade 1" and "1"
    const normalizeGrade = (g) => String(g || '').toLowerCase().replace(/\s+/g, '').replace(/^grade/, '');
    const requested = normalizeGrade(grade);
    const teacherGrades = (teacher.grades || []).map(normalizeGrade);
    if (teacher.grade) teacherGrades.push(normalizeGrade(teacher.grade));
    if (teacher.classTeacherGrade) teacherGrades.push(normalizeGrade(teacher.classTeacherGrade));
    if (!teacherGrades.includes(requested)) {
      return res.status(403).json({ message: `You cannot post to grade "${grade}". Your grades: ${[...(teacher.grades||[]), teacher.grade, teacher.classTeacherGrade].filter(Boolean).join(', ') || 'none'}` });
    }

    // Get all parent IDs for this grade
    const students = await Student.find({ grade });
    console.log('[DailyUpdate CREATE] Students found:', students.length);
    const parentIds = [];
    for (const student of students) {
      parentIds.push(...student.parentIDs);
    }
    const uniqueParentIds = [...new Set(parentIds)];
    console.log('[DailyUpdate CREATE] Unique parent IDs:', uniqueParentIds.length);

    const update = new DailyUpdate({
      grade,
      teacher: req.user.refId,
      title,
      content,
      category: category || 'general',
      visibility: {
        grade,
        parentIds: uniqueParentIds
      }
    });

    console.log('[DailyUpdate CREATE] About to save update');
    await update.save();
    console.log('[DailyUpdate CREATE] Update saved, ID:', update._id);

    // Populate teacher info before sending response
    await update.populate('teacher', 'name profilePicture');

    res.json({ update });
  } catch (err) {
    console.error('Error creating daily update:', err.message, err.stack);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get specific update with comments
router.get('/:updateId', auth(), async (req, res) => {
  try {
    const { updateId } = req.params;

    const update = await DailyUpdate.findById(updateId)
      .populate('teacher', 'name profilePicture');

    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Verify access
    if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId);
      if (!update.visibility.parentIds.includes(parent._id.toString())) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.refId);
      if (!teacher.grades.includes(update.grade)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(update);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to update (only parents of that grade)
router.post('/:updateId/comment', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can comment' });
    }

    const { updateId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const update = await DailyUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    // Verify parent has access
    const parent = await Parent.findById(req.user.refId);
    if (!update.visibility.parentIds.includes(parent._id.toString())) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Add comment
    const comment = {
      parentId: req.user.refId,
      parentName: parent.name,
      text: text.trim(),
      createdAt: new Date()
    };

    update.comments.push(comment);
    await update.save();
    await update.populate('teacher', 'name profilePicture');

    res.json({ update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark update as seen (parents only)
router.post('/:updateId/mark-seen', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can mark as seen' });
    }

    const { updateId } = req.params;
    const update = await DailyUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    const parent = await Parent.findById(req.user.refId);
    if (!update.visibility.parentIds.includes(parent._id.toString())) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!update.seenBy.includes(req.user.refId)) {
      update.seenBy.push(req.user.refId);
      await update.save();
    }

    await update.populate('teacher', 'name profilePicture');
    res.json({ update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (only by parent who created it or teacher/admin)
router.delete('/:updateId/comment/:commentId', auth(), async (req, res) => {
  try {
    const { updateId, commentId } = req.params;

    const update = await DailyUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    const comment = update.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check authorization
    if (req.user.role === 'parent') {
      if (comment.parentId.toString() !== req.user.refId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    update.comments.id(commentId).deleteOne();
    await update.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post (only by the teacher who created it)
router.put('/:updateId', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { updateId } = req.params;
    const { title, content, category } = req.body;

    const update = await DailyUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    if (update.teacher.toString() !== req.user.refId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (title) update.title = title;
    if (content) update.content = content;
    if (category) update.category = category;

    await update.save();

    res.json({ message: 'Update modified successfully', update });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (only by the teacher who created it)
router.delete('/:updateId', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { updateId } = req.params;

    const update = await DailyUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: 'Update not found' });
    }

    if (req.user.role === 'teacher' && update.teacher.toString() !== req.user.refId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await DailyUpdate.findByIdAndDelete(updateId);

    res.json({ message: 'Update deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
