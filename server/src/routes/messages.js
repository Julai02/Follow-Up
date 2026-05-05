const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const auth = require('../middleware/auth');

let io = null;
router.setIO = (socketio) => { io = socketio; };

// Helper function to populate display names
async function populateDisplayName(userObj) {
  if (!userObj || !userObj.refId) return userObj;
  
  try {
    if (userObj.roleRef === 'Parent') {
      const parent = await Parent.findById(userObj.refId).select('name');
      if (parent) userObj.displayName = parent.name;
    } else if (userObj.roleRef === 'Teacher') {
      const teacher = await Teacher.findById(userObj.refId).select('name');
      if (teacher) userObj.displayName = teacher.name;
    }
  } catch (err) {
    console.error('Error populating display name:', err);
  }
  
  return userObj;
}

// Send message
router.post('/', auth(['teacher','parent']), async (req, res) => {
  try {
    const { toUserId, text, studentId } = req.body;
    console.log('POST /api/messages - headers:', Object.keys(req.headers).filter(k=>k.startsWith('authorization')||k==='authorization'));
    console.log('POST /api/messages - body:', req.body);
    console.log('Authenticated user:', req.user && req.user._id);
    if (!toUserId || !text) return res.status(400).json({ message: 'toUserId and text required' });
    if (typeof text !== 'string' || text.trim().length === 0) return res.status(400).json({ message: 'Message text cannot be empty' });
    if (text.length > 5000) return res.status(400).json({ message: 'Message exceeds maximum length (5000 chars)' });
    const msg = await Message.create({ fromUser: req.user._id, toUser: toUserId, text, student: studentId });
    // populate before responding/emitting so client gets sender info
    const populated = await msg.populate([
      { path: 'fromUser', select: 'username role _id refId roleRef' },
      { path: 'toUser', select: 'username role _id refId roleRef' }
    ]);
    
    const msgObj = populated.toObject();
    
    // Add display names using helper function
    msgObj.fromUser = await populateDisplayName(msgObj.fromUser);
    msgObj.toUser = await populateDisplayName(msgObj.toUser);
    // Emit via socket.io if available - send to BOTH sender and recipient
    const senderIdStr = req.user._id.toString();
    const recipientIdStr = toUserId.toString();
    console.log(`Message created from ${senderIdStr} -> ${recipientIdStr} (student: ${studentId})`);
    console.log('Populated message before emit:', JSON.stringify({
      _id: msgObj._id,
      fromUser: msgObj.fromUser,
      toUser: msgObj.toUser,
      text: msgObj.text
    }, null, 2));
    if (io) {
      console.log('Emitting message to sender room:', senderIdStr);
      console.log('Emitting message to recipient room:', recipientIdStr);
      // Send to recipient
      io.to(recipientIdStr).emit('message', msgObj);
      // Send to sender so they see their own message
      io.to(senderIdStr).emit('message', msgObj);
    }
    res.json({ message: msgObj });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ message: 'Failed to send message: ' + (err.message || 'Server error') });
  }
});

// Get conversation for a user
router.get('/conversation/:otherUserId', auth(['teacher','parent']), async (req, res) => {
  try {
    const me = req.user._id;
    const other = req.params.otherUserId;
    const messages = await Message.find({ $or: [ { fromUser: me, toUser: other }, { fromUser: other, toUser: me } ] }).sort('createdAt').populate([
      { path: 'fromUser', select: 'username role refId roleRef' },
      { path: 'toUser', select: 'username role refId roleRef' }
    ]);
    
    // Populate the actual names from Parent/Teacher models
    const populatedMessages = await Promise.all(messages.map(async (msg) => {
      const msgObj = msg.toObject();
      
      // Populate fromUser and toUser names using helper function
      msgObj.fromUser = await populateDisplayName(msgObj.fromUser);
      msgObj.toUser = await populateDisplayName(msgObj.toUser);
      
      return msgObj;
    }));
    
    res.json({ messages: populatedMessages });
  } catch (err) {
    console.error('Error fetching conversation:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid user ID format' });
    res.status(500).json({ message: 'Failed to load conversation: ' + err.message });
  }
});

// Mark messages as read
router.put('/read/:messageId', auth(['teacher','parent']), async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.messageId, { read: true }, { new: true });
    res.json({ message: msg });
  } catch (err) {
    console.error('Error marking message as read:', err);
    if (err.message.includes('Cast to ObjectId failed')) return res.status(400).json({ message: 'Invalid message ID' });
    res.status(500).json({ message: 'Failed to mark message as read: ' + err.message });
  }
});

module.exports = router;
