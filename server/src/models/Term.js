const mongoose = require('mongoose');

const termSchema = new mongoose.Schema({
  termNumber: { type: Number, required: true, enum: [1, 2, 3] }, // CBC has 3 terms per year
  year: { type: Number, required: true },
  name: { type: String, required: true }, // e.g., "Term 1 2024"
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  academicYear: { type: String, required: true } // e.g., "2024/2025"
}, { timestamps: true });

module.exports = mongoose.model('Term', termSchema);
