const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Return user by refId (refers to Parent or Teacher doc id)
router.get('/ref/:refId', async (req, res) => {
  try {
    const user = await User.findOne({ refId: req.params.refId }).select('_id username role refId');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
