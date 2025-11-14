const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String },
  grade: { type: String },
  subject: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
