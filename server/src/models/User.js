const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  email: { type: String, required: false },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'roleRef' },
  roleRef: { type: String, enum: ['Parent', 'Teacher', 'Admin'], required: false },
  lastLogin: { type: Date },
  passwordHistory: [{
    password: String,
    changedAt: { type: Date, default: Date.now }
  }],
  lastPasswordChange: Date,
  requirePasswordChange: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
