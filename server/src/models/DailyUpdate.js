const mongoose = require('mongoose');

const dailyUpdateSchema = new mongoose.Schema({
  grade: { type: String, required: true }, // e.g., "Grade 4", "Class 3"
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ['homework', 'announcement', 'event', 'general'], default: 'general' },
  comments: [{
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent' },
    parentName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  visibility: {
    grade: { type: String, required: true }, // Only parents of this grade can see
    parentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }] // Cached parent IDs for this grade
  },
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  isPublished: { type: Boolean, default: true },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('DailyUpdate', dailyUpdateSchema);
