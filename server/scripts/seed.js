require('dotenv').config();
const connectDB = require('../src/config/db');
const Teacher = require('../src/models/Teacher');
const Parent = require('../src/models/Parent');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const seed = async () => {
  await connectDB(process.env.MONGO_URI);
  await Teacher.deleteMany({});
  await Parent.deleteMany({});
  await Student.deleteMany({});
  await User.deleteMany({});

  const t1 = await Teacher.create({ uniqueID: 'T100', name: 'Ms. Alice', contact: 'alice@school.com', grade: 'Grade 1', subject: 'Math' });
  const hash = await bcrypt.hash('teacherpass', 10);
  await User.create({ role: 'teacher', username: 't_T100', password: hash, refId: t1._id, roleRef: 'Teacher' });

  console.log('Seed complete');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
