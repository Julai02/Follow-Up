const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String },
  email: { type: String },
  position: { type: String },
  grades: [{ type: String }], // Array of grade levels (e.g., ['Grade 1', 'Grade 2'])
  subjects: [{ type: String }], // Array of subjects taught
  grade: { type: String }, // Kept for backward compatibility
  subject: { type: String }, // Kept for backward compatibility
  isClassTeacher: { type: Boolean, default: false },
  classTeacherGrade: { type: String },
  profilePicture: {
    data: String, // Data URL (base64)
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
