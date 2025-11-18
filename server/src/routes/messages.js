const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

let io = null;
router.setIO = (socketio) => { io = socketio; };

// Send message
router.post('/', auth(['teacher','parent']), async (req, res) => {
  try {
    const { toUserId, text, studentId } = req.body;
    console.log('POST /api/messages - headers:', Object.keys(req.headers).filter(k=>k.startsWith('authorization')||k==='authorization'));
    console.log('POST /api/messages - body:', req.body);
    console.log('Authenticated user:', req.user && req.user._id);
    if (!toUserId || !text) return res.status(400).json({ message: 'toUserId and text required' });
    const msg = await Message.create({ fromUser: req.user._id, toUser: toUserId, text, student: studentId });
    // populate before responding/emitting so client gets sender info
    const populated = await msg.populate([
      { path: 'fromUser', select: 'username role _id' },
      { path: 'toUser', select: 'username role _id' }
    ]);
    // Emit via socket.io if available - send to BOTH sender and recipient
    const senderIdStr = req.user._id.toString();
    const recipientIdStr = toUserId.toString();
    console.log(`Message created from ${senderIdStr} -> ${recipientIdStr} (student: ${studentId})`);
    console.log('Populated message before emit:', JSON.stringify({
      _id: populated._id,
      fromUser: populated.fromUser,
      toUser: populated.toUser,
      text: populated.text
    }, null, 2));
    if (io) {
      console.log('Emitting message to sender room:', senderIdStr);
      console.log('Emitting message to recipient room:', recipientIdStr);
      // Send to recipient
      io.to(recipientIdStr).emit('message', populated.toJSON());
      // Send to sender so they see their own message
      io.to(senderIdStr).emit('message', populated.toJSON());
    }
    res.json({ message: populated });
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
    const messages = await Message.find({ $or: [ { fromUser: me, toUser: other }, { fromUser: other, toUser: me } ] }).sort('createdAt').populate([
      { path: 'fromUser', select: 'username role' },
      { path: 'toUser', select: 'username role' }
    ]);
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/read/:messageId', auth(['teacher','parent']), async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.messageId, { read: true }, { new: true });
    res.json({ message: msg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
