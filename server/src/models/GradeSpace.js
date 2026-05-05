const mongoose = require('mongoose');

const gradeSpaceSchema = new mongoose.Schema({
  grade: { type: String, required: true }, // e.g., "Grade 4", "Class 3"
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }, // Teacher who posted (optional)
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }, // Parent who posted (optional)
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['announcement', 'alert', 'event', 'general'], default: 'general' },
  comments: [{
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    parentName: String,
    authorRole: { type: String, enum: ['parent', 'teacher'] },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  visibility: {
    grade: { type: String, required: true }, // Only parents of this grade can see
    parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }] // Cached parent IDs for this grade
  },
  isPublished: { type: Boolean, default: true },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }] // Track likes
}, { timestamps: true });

module.exports = mongoose.model('GradeSpace', gradeSpaceSchema);
