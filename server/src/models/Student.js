const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  grade: { type: String, required: true },
  parentsContact: [{ type: String }],
  parentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  homeLocation: { type: String },
  academicRecords: [{
    term: String,
    subject: String,
    score: Number,
    remarks: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
