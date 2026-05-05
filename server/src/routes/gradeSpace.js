const express = require('express');
const router = express.Router();
const GradeSpace = require('../models/GradeSpace');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Debug middleware to log incoming requests to this router
router.use((req, res, next) => {
  try {
    console.log(`[GradeSpace DEBUG] ${req.method} ${req.path} Authorization: ${!!req.headers.authorization}`);
  } catch (e) { /* ignore */ }
  next();
});

// Get all announcements for a grade (visible only to parents and teachers of that grade)
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

    const announcements = await GradeSpace.find({
      'visibility.grade': grade,
      isPublished: true
    })
      .populate('teacher', 'name profilePicture')
      .populate('parent', 'name profilePicture')
      .sort({ createdAt: -1 });

    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create announcement (teachers and parents can create)
router.post('/create', auth(), async (req, res) => {
  try {
    console.log('[GradeSpace CREATE] User:', req.user);
    if (req.user.role !== 'teacher' && req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only teachers and parents can create announcements' });
    }

    const { title, content, type, grade } = req.body;
    console.log('[GradeSpace CREATE] Payload:', { title, content, type, grade });

    if (!title || !content || !grade) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Verify user has access to this grade
    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.refId);
      console.log('[GradeSpace CREATE] Teacher found:', teacher);
      if (!teacher) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      const normalizeGrade = (g) => String(g || '').toLowerCase().replace(/\s+/g, '').replace(/^grade/, '');
      const requested = normalizeGrade(grade);
      const teacherGrades = (teacher.grades || []).map(normalizeGrade);
      if (teacher.grade) teacherGrades.push(normalizeGrade(teacher.grade));
      if (teacher.classTeacherGrade) teacherGrades.push(normalizeGrade(teacher.classTeacherGrade));
      if (!teacherGrades.includes(requested)) {
        return res.status(403).json({ message: `You cannot post to grade "${grade}". Your grades: ${[...(teacher.grades||[]), teacher.grade, teacher.classTeacherGrade].filter(Boolean).join(', ') || 'none'}` });
      }
    } else if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId).populate('childIDs');
      console.log('[GradeSpace CREATE] Parent found:', parent);
      if (!parent) {
        return res.status(404).json({ message: 'Parent not found' });
      }
      const normalizeGrade = (g) => String(g || '').toLowerCase().replace(/\s+/g, '').replace(/^grade/, '');
      const requested = normalizeGrade(grade);
      const parentGrades = (parent.childIDs || []).map(child => normalizeGrade(child.grade));
      if (!parentGrades.includes(requested)) {
        return res.status(403).json({ message: `You cannot post to grade "${grade}". Your children's grades: ${parent.childIDs?.map(c=>c.grade).join(', ') || 'none'}` });
      }
    }

    // Get all parent IDs for this grade
    const students = await Student.find({ grade });
    console.log('[GradeSpace CREATE] Students found:', students.length);
    const parentIds = [];
    for (const student of students) {
      parentIds.push(...student.parentIDs);
    }
    const uniqueParentIds = [...new Set(parentIds)];
    console.log('[GradeSpace CREATE] Unique parent IDs:', uniqueParentIds.length);

    const announcement = new GradeSpace({
      grade,
      teacher: req.user.role === 'teacher' ? req.user.refId : null,
      parent: req.user.role === 'parent' ? req.user.refId : null,
      title,
      content,
      type: type || 'general',
      visibility: {
        grade,
        parentIds: uniqueParentIds
      }
    });

    console.log('[GradeSpace CREATE] About to save announcement');
    await announcement.save();
    console.log('[GradeSpace CREATE] Announcement saved, ID:', announcement._id);

    // Populate teacher and parent info before sending response
    await announcement.populate('teacher', 'name profilePicture');
    await announcement.populate('parent', 'name profilePicture');

    res.json({ announcement });
  } catch (err) {
    console.error('Error creating announcement:', err.message, err.stack);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

// Get specific announcement with comments
router.get('/:announcementId', auth(), async (req, res) => {
  try {
    const { announcementId } = req.params;

    const announcement = await GradeSpace.findById(announcementId)
      .populate('teacher', 'name profilePicture')
      .populate('comments.parentId', 'name profilePicture');

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Verify user has access
    if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId).populate('childIDs');
      const parentGrades = parent.childIDs.map(child => child.grade);
      if (!parentGrades.includes(announcement.visibility.grade)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.refId);
      if (!teacher.grades || !teacher.grades.includes(announcement.visibility.grade)) {
        if (announcement.teacher.toString() !== req.user.refId.toString()) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
      }
    }

    res.json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to announcement (teachers and parents can comment)
router.post('/:announcementId/comment', auth(), async (req, res) => {
  try {
    const { announcementId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (req.user.role !== 'parent' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only parents and teachers can comment' });
    }

    const announcement = await GradeSpace.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Verify access to this grade
    let authorName = 'User';
    if (req.user.role === 'parent') {
      const parent = await Parent.findById(req.user.refId).populate('childIDs');
      authorName = parent?.name || 'Parent';
      // Allow if this parent is included in the announcement's cached visibility parentIds
      const allowedParentIds = (announcement.visibility && announcement.visibility.parentIds) ? announcement.visibility.parentIds.map(id => String(id)) : [];
      if (!allowedParentIds.includes(String(parent._id))) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.refId);
      authorName = teacher?.name || 'Teacher';
      // Allow if teacher is the creator or teaches this grade (support legacy fields)
      const normalizeGrade = (g) => String(g || '').toLowerCase().replace(/\s+/g, '').replace(/^grade/, '');
      const requested = normalizeGrade(announcement.visibility?.grade);
      const teacherGrades = (teacher.grades || []).map(normalizeGrade);
      if (teacher.grade) teacherGrades.push(normalizeGrade(teacher.grade));
      if (teacher.classTeacherGrade) teacherGrades.push(normalizeGrade(teacher.classTeacherGrade));
      const isCreator = announcement.teacher && String(announcement.teacher) === String(teacher._id);
      if (!isCreator && !teacherGrades.includes(requested)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
    }

    const commentData = {
      text,
      createdAt: new Date(),
      parentName: authorName,
      authorRole: req.user.role
    };

    if (req.user.role === 'parent') {
      commentData.parentId = req.user.refId;
    } else if (req.user.role === 'teacher') {
      commentData.teacherId = req.user.refId;
    }

    announcement.comments.push(commentData);

    await announcement.save();
    await announcement.populate('teacher', 'name profilePicture');
    await announcement.populate('parent', 'name profilePicture');

    res.json({ announcement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike announcement
router.post('/:announcementId/like', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Only parents can like announcements' });
    }

    const { announcementId } = req.params;
    const announcement = await GradeSpace.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const parentId = req.user.refId;
    const likeIndex = announcement.likes.indexOf(parentId);

    if (likeIndex > -1) {
      // Unlike
      announcement.likes.splice(likeIndex, 1);
    } else {
      // Like
      announcement.likes.push(parentId);
    }

    await announcement.save();
    res.json({ message: 'Like updated', likes: announcement.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete announcement (creator or admin only)
router.delete('/:announcementId', auth(), async (req, res) => {
  try {
    const { announcementId } = req.params;
    const announcement = await GradeSpace.findById(announcementId);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Check authorization - teacher, parent creator, or admin can delete
    const isTeacherCreator = req.user.role === 'teacher' && announcement.teacher && announcement.teacher.toString() === req.user.refId.toString();
    const isParentCreator = req.user.role === 'parent' && announcement.parent && announcement.parent.toString() === req.user.refId.toString();
    
    if (!isTeacherCreator && !isParentCreator && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only the creator or admin can delete this' });
    }

    await GradeSpace.findByIdAndDelete(announcementId);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
