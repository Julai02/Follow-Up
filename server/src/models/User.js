const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['parent', 'teacher', 'admin'], required: true },
  email: { type: String, required: false },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refId: { type: mongoose.Schema.Types.ObjectId, refPath: 'roleRef' },
  roleRef: { type: String, enum: ['Parent', 'Teacher'], required: false }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
