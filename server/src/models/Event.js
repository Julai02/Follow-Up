const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String }, // Format: "HH:MM"
  endTime: { type: String }, // Format: "HH:MM"
  type: {
    type: String,
    enum: ['meeting', 'school_event', 'assignment', 'holiday', 'reminder', 'other'],
    default: 'other'
  },
  visibility: {
    type: String,
    enum: ['public', 'teachers_only', 'parents_only', 'class_specific'],
    default: 'public'
  },
  // For class_specific visibility
  grade: { type: String }, // e.g., "Grade 1", "Grade 2", etc.
  // Created by
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: { type: String, enum: ['teacher', 'parent'], required: true },
    name: { type: String, required: true }
  },
  // Associated entities
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // For teacher-created events
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }, // For parent-created events
  studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }] // For events related to specific students
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);