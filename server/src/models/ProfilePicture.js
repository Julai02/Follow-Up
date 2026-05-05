const mongoose = require('mongoose');

const profilePictureSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  data: { type: String, required: true }, // Data URL (base64)
  filename: String,
  size: Number, // In bytes
  uploadedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure only one profile picture per user
profilePictureSchema.index({ userId: 1, userRole: 1 }, { unique: true });

module.exports = mongoose.model('ProfilePicture', profilePictureSchema);
