const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Send message
router.post('/', auth(['teacher','parent']), async (req, res) => {
  try {
    const { toUserId, text, studentId } = req.body;
    const msg = await Message.create({ fromUser: req.user._id, toUser: toUserId, text, student: studentId });
    // In production, emit via socket.io
    res.json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversation for a user
router.get('/conversation/:otherUserId', auth(['teacher','parent']), async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.otherUserId;
    const messages = await Message.find({ $or: [ { fromUser: me, toUser: other }, { fromUser: other, toUser: me } ] }).sort('createdAt');
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
