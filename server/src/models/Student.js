const mongoose = require('mongoose');

const normalizeTerm = (term) => {
  if (typeof term === 'string') {
    const cleaned = term.trim().toLowerCase().replace(/^term\s*/i, '')
    const parsed = Number(cleaned)
    if (!Number.isInteger(parsed)) throw new Error('Term must be integer 1-3')
    if (parsed < 1 || parsed > 3) throw new Error('Term must be between 1 and 3')
    return parsed
  }
  if (typeof term === 'number') {
    if (!Number.isInteger(term) || term < 1 || term > 3) throw new Error('Term must be between 1 and 3')
    return term
  }
  throw new Error('Term must be numeric or string 1-3')
}

const studentSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  grade: { type: String, required: true },
  parentsContact: [{ type: String }],
  parentIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Parent' }],
  homeLocation: { type: String },
  academicRecords: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    term: {
      type: Number,
      set: normalizeTerm,
      validate: {
        validator: (v) => Number.isInteger(v) && v >= 1 && v <= 3,
        message: 'Term must be 1, 2, or 3'
      }
    },
    subject: String,
    score: Number,
    remarks: String,
    date: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
