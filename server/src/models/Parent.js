const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
  uniqueID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  contact: { type: String },
  email: { type: String },
  childIDs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  profilePicture: {
    data: String, // Data URL (base64)
    filename: String,
    uploadedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

module.exports = mongoose.model('Parent', parentSchema);
