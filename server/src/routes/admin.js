const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Configure email transporter (update with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper function to generate credentials
function generateCredentials() {
  const username = 'teacher_' + Math.random().toString(36).substring(2, 9);
  const password = Math.random().toString(36).substring(2, 10) + 'Aa1!';
  return { username, password };
}

// Get admin profile
router.get('/profile', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const admin = await Admin.findById(req.user.refId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin profile picture
router.post('/profile/picture', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { profilePictureData } = req.body; // Data URL

    // Check file size (2MB limit = 2097152 bytes)
    if (profilePictureData.length > 2097152) {
      return res.status(400).json({ message: 'Profile picture exceeds 2MB limit' });
    }

    const admin = await Admin.findById(req.user.refId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    admin.profilePicture = {
      data: profilePictureData,
      filename: `admin-${admin._id}-${Date.now()}`,
      uploadedAt: new Date()
    };

    await admin.save();
    res.json({ message: 'Profile picture updated successfully', profilePicture: admin.profilePicture });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change admin password
router.post('/change-password', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Keep password history
    if (!user.passwordHistory) {
      user.passwordHistory = [];
    }
    user.passwordHistory.push({ password: user.password, changedAt: new Date() });

    user.password = hashedPassword;
    user.lastPasswordChange = new Date();
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Onboard teacher - create Teacher profile and User account
router.post('/onboard-teacher', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { name, contact, subjects, grades, isClassTeacher, classTeacherGrade, email } = req.body;

    // Validate input
    if (!name || !contact || !subjects || !grades) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({ name, contact });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this name and contact already exists' });
    }

    // Generate credentials
    const { username, password } = generateCredentials();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Teacher profile
    const teacher = new Teacher({
      uniqueID: 'TECH_' + Date.now(),
      name,
      contact,
      subjects: Array.isArray(subjects) ? subjects : [subjects],
      grades: Array.isArray(grades) ? grades : [grades],
      isClassTeacher: isClassTeacher || false,
      classTeacherGrade: classTeacherGrade || null
    });

    await teacher.save();

    // Create User account
    const user = new User({
      role: 'teacher',
      email: email || null,
      username,
      password: hashedPassword,
      refId: teacher._id,
      roleRef: 'Teacher',
      requirePasswordChange: true
    });

    await user.save();

    // Send credentials via email
    if (email) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Follow-Up: Teacher Account Created',
        html: `
          <h2>Welcome to Follow-Up!</h2>
          <p>Your teacher account has been created successfully.</p>
          <p><strong>Login Details:</strong></p>
          <ul>
            <li><strong>Username:</strong> ${username}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>
          <p>Please log in and change your password immediately for security.</p>
          <p>Access Follow-Up at: <a href="${process.env.APP_URL || 'http://localhost:3000'}">${process.env.APP_URL || 'http://localhost:3000'}</a></p>
          <p>If you did not request this account, please contact the administrator.</p>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Email sending error:', error);
        } else {
          console.log('Email sent:', info.response);
        }
      });
    }

    res.json({
      message: 'Teacher onboarded successfully',
      teacher: {
        id: teacher._id,
        uniqueID: teacher.uniqueID,
        name: teacher.name,
        username
      },
      credentials: {
        username,
        password,
        note: 'Credentials have been sent to the teacher email if provided'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all teachers
router.get('/teachers', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all parents and students
router.get('/overview', auth(), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const teacherCount = await Teacher.countDocuments();
    const parentCount = await Parent.countDocuments();
    const studentCount = await Student.countDocuments();
    const userCount = await User.countDocuments();

    res.json({
      teachers: teacherCount,
      parents: parentCount,
      students: studentCount,
      totalUsers: userCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
