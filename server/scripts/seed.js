require('dotenv').config();
const connectDB = require('../src/config/db');
const Teacher = require('../src/models/Teacher');
const Parent = require('../src/models/Parent');
const Student = require('../src/models/Student');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('Clearing database...');
    await Teacher.deleteMany({});
    await Parent.deleteMany({});
    await Student.deleteMany({});
    await User.deleteMany({});

    console.log('Creating teachers...');
    const t1 = await Teacher.create({ uniqueID: 'T001', name: 'Ms. Alice Johnson', contact: 'alice@school.com', grade: 'Grade 1', subject: 'Mathematics' });
    const t2 = await Teacher.create({ uniqueID: 'T002', name: 'Mr. Bob Smith', contact: 'bob@school.com', grade: 'Grade 2', subject: 'English' });
    const t3 = await Teacher.create({ uniqueID: 'T003', name: 'Mrs. Carol Lee', contact: 'carol@school.com', grade: 'Grade 1', subject: 'Science' });

    // Create teacher user accounts
    const createTeacherUser = async (teacher, pwd) => {
      const username = `t_${teacher.uniqueID}`;
      const hash = await bcrypt.hash(pwd, 10);
      return User.create({ role: 'teacher', username, password: hash, refId: teacher._id, roleRef: 'Teacher' });
    };
    await createTeacherUser(t1, 'teacher123');
    await createTeacherUser(t2, 'teacher123');
    await createTeacherUser(t3, 'teacher123');

    console.log('Creating parents and students...');
    const createParent = async (uniqueID, name, contact) => {
      const parent = await Parent.create({ uniqueID, name, contact });
      const username = `p_${uniqueID}`;
      const password = 'parent123';
      const hash = await bcrypt.hash(password, 10);
      await User.create({ role: 'parent', username, password: hash, refId: parent._id, roleRef: 'Parent' });
      return parent;
    };

    const p1 = await createParent('P001', 'John Doe', '555-0001');
    const p2 = await createParent('P002', 'Jane Smith', '555-0002');
    const p3 = await createParent('P003', 'Michael Brown', '555-0003');
    const p4 = await createParent('P004', 'Sarah Davis', '555-0004');

    // Create students with parents
    const s1 = await Student.create({
      uniqueID: 'S001',
      name: 'Emma Doe',
      grade: 'Grade 1',
      parentsContact: ['555-0001'],
      parentIDs: [p1._id],
      homeLocation: 'Downtown'
    });
    p1.childIDs.push(s1._id);
    await p1.save();

    const s2 = await Student.create({
      uniqueID: 'S002',
      name: 'Liam Smith',
      grade: 'Grade 2',
      parentsContact: ['555-0002'],
      parentIDs: [p2._id],
      homeLocation: 'Midtown'
    });
    p2.childIDs.push(s2._id);
    await p2.save();

    const s3 = await Student.create({
      uniqueID: 'S003',
      name: 'Olivia Brown',
      grade: 'Grade 1',
      parentsContact: ['555-0003', '555-0004'],
      parentIDs: [p3._id, p4._id],
      homeLocation: 'Uptown'
    });
    p3.childIDs.push(s3._id);
    p4.childIDs.push(s3._id);
    await p3.save();
    await p4.save();

    const s4 = await Student.create({
      uniqueID: 'S004',
      name: 'Noah Johnson',
      grade: 'Grade 1',
      parentsContact: ['555-0001'],
      parentIDs: [p1._id],
      homeLocation: 'Downtown'
    });
    p1.childIDs.push(s4._id);
    await p1.save();

    // Add some academic records
    s1.academicRecords.push({ term: 'Term 1', subject: 'Mathematics', score: 85, remarks: 'Good progress' });
    s2.academicRecords.push({ term: 'Term 1', subject: 'English', score: 78, remarks: 'Needs improvement in writing' });
    await s1.save();
    await s2.save();

    console.log('\n✅ Seed complete!\n');
    console.log('Test credentials:');
    console.log('Teachers: username=t_T001, password=teacher123');
    console.log('         username=t_T002, password=teacher123');
    console.log('         username=t_T003, password=teacher123');
    console.log('Parents:  username=p_P001, password=parent123');
    console.log('         username=p_P002, password=parent123');
    console.log('         username=p_P003, password=parent123');
    console.log('         username=p_P004, password=parent123\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
