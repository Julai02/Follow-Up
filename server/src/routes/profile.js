const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');
const ProfilePicture = require('../models/ProfilePicture');
const auth = require('../middleware/auth');

// Get user profile (parent or teacher)
router.get('/me', auth(), async (req, res) => {
  try {
    let profile;
    if (req.user.role === 'parent') {
      profile = await Parent.findById(req.user.refId).populate('childIDs');
    } else if (req.user.role === 'teacher') {
      profile = await Teacher.findById(req.user.refId);
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/picture', auth(), async (req, res) => {
  try {
    const { profilePictureData } = req.body; // Data URL

    // Check file size (2MB limit = 2097152 bytes)
    if (profilePictureData.length > 2097152) {
      return res.status(400).json({ message: 'Profile picture exceeds 2MB limit' });
    }

    let profile;
    if (req.user.role === 'parent') {
      profile = await Parent.findById(req.user.refId);
    } else if (req.user.role === 'teacher') {
      profile = await Teacher.findById(req.user.refId);
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.profilePicture = {
      data: profilePictureData,
      filename: `${req.user.role}-${profile._id}-${Date.now()}`,
      uploadedAt: new Date()
    };

    await profile.save();
    res.json({ message: 'Profile picture updated successfully', profilePicture: profile.profilePicture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', auth(), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify old password
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Keep password history (last 5 passwords)
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    user.passwordHistory.push({ password: user.password, changedAt: new Date() });
    if (user.passwordHistory.length > 5) {
      user.passwordHistory.shift(); // Keep only last 5
    }

    user.password = hashedPassword;
    user.lastPasswordChange = new Date();
    user.requirePasswordChange = false; // Mark as changed
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update parent profile
router.put('/parent', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'parent') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, contact } = req.body;
    const parent = await Parent.findByIdAndUpdate(
      req.user.refId,
      { name, contact },
      { new: true }
    ).populate('childIDs');

    if (!parent) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    res.json({ message: 'Profile updated successfully', parent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update teacher profile
router.put('/teacher', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, contact, subjects, grades, isClassTeacher, classTeacherGrade } = req.body;
    const teacher = await Teacher.findByIdAndUpdate(
      req.user.refId,
      {
        name,
        contact,
        subjects: Array.isArray(subjects) ? subjects : [subjects],
        grades: Array.isArray(grades) ? grades : [grades],
        isClassTeacher: isClassTeacher || false,
        classTeacherGrade: classTeacherGrade || null
      },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    res.json({ message: 'Profile updated successfully', teacher });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
