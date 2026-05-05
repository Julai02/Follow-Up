const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String },
  email: { type: String, required: true, unique: true },
  profilePicture: {
    data: String, // Data URL
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  permissions: [String], // e.g., ['teacher_onboarding', 'view_reports', 'manage_admins']
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastLogin: Date
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);
