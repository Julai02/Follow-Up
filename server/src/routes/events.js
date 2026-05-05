const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get events visible to the current user
router.get('/', auth(['teacher', 'parent']), async (req, res) => {
  try {
    const { role, refId } = req.user;
    let query = {};

    if (role === 'teacher') {
      // Teachers can see: public events, teacher-only events, and class-specific events for their grade
      const teacher = await Teacher.findById(refId);
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

      query = {
        $or: [
          { visibility: 'public' },
          { visibility: 'teachers_only' },
          { visibility: 'class_specific', grade: teacher.grade }
        ]
      };
    } else if (role === 'parent') {
      // Parents can see: public events, parent-only events, and events related to their children
      const parent = await Parent.findById(refId).populate('childIDs');
      if (!parent) return res.status(404).json({ message: 'Parent not found' });

      const childIds = parent.childIDs.map(child => child._id);
      const childGrades = [...new Set(parent.childIDs.map(child => child.grade))];

      query = {
        $or: [
          { visibility: 'public' },
          { visibility: 'parents_only' },
          { visibility: 'class_specific', grade: { $in: childGrades } },
          { studentIds: { $in: childIds } }
        ]
      };
    }

    const events = await Event.find(query).sort({ date: 1, startTime: 1 });
    res.json({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ message: 'Failed to load events: ' + err.message });
  }
});

// Create a new event
router.post('/', auth(['teacher', 'parent']), async (req, res) => {
  try {
    const userId = req.user._id;
    const { role, refId } = req.user;
    const { title, description, date, startTime, endTime, type, visibility, grade, studentIds } = req.body;
    
    // Input validation
    if (!title || !date || !type) {
      return res.status(400).json({ message: 'Title, date, and type are required' });
    }
    if (typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
      return res.status(400).json({ message: 'Title must be a non-empty string (max 200 chars)' });
    }
    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return res.status(400).json({ message: 'Description must be a string (max 1000 chars)' });
    }
    if (!['meeting', 'exam', 'holiday', 'activity'].includes(type)) {
      return res.status(400).json({ message: 'Invalid event type' });
    }
    if (!['public', 'grade', 'private', 'teachers_only', 'parents_only', 'class_specific'].includes(visibility)) {
      return res.status(400).json({ message: 'Invalid visibility setting' });
    }
    
    let creatorInfo = {};
    let teacherId = null;
    let parentId = null;

    if (role === 'teacher') {
      const teacher = await Teacher.findById(refId);
      if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
      creatorInfo = { userId, userType: 'teacher', name: teacher.name };
      teacherId = teacher._id;
    } else if (role === 'parent') {
      const parent = await Parent.findById(refId);
      if (!parent) return res.status(404).json({ message: 'Parent not found' });
      creatorInfo = { userId, userType: 'parent', name: parent.name };
      parentId = parent._id;
    }

    const event = new Event({
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      type: type || 'other',
      visibility: visibility || 'public',
      grade: visibility === 'class_specific' ? grade : undefined,
      createdBy: creatorInfo,
      teacherId,
      parentId,
      studentIds: studentIds || []
    });

    await event.save();
    res.json({ event });
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ message: 'Failed to create event: ' + err.message });
  }
});

// Update an event (only creator can update)
router.put('/:id', auth(['teacher', 'parent']), async (req, res) => {
  try {
    const userId = req.user._id;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user is the creator
    if (event.createdBy.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only update events you created' });
    }

    const { title, description, date, startTime, endTime, type, visibility, grade, studentIds } = req.body;

    event.title = title || event.title;
    event.description = description !== undefined ? description : event.description;
    event.date = date ? new Date(date) : event.date;
    event.startTime = startTime !== undefined ? startTime : event.startTime;
    event.endTime = endTime !== undefined ? endTime : event.endTime;
    event.type = type || event.type;
    event.visibility = visibility || event.visibility;
    event.grade = visibility === 'class_specific' ? grade : undefined;
    event.studentIds = studentIds || event.studentIds;

    await event.save();
    res.json({ event });
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ message: 'Failed to update event: ' + err.message });
  }
});

// Delete an event (only creator can delete)
router.delete('/:id', auth(['teacher', 'parent']), async (req, res) => {
  try {
    const userId = req.user._id;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user is the creator
    if (event.createdBy.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only delete events you created' });
    }

    await event.remove();
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: 'Failed to delete event: ' + err.message });
  }
});

module.exports = router;