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
    const t1 = await Teacher.create({ uniqueID: 'T001', name: 'Ms. Alice Mwawasi', contact: 'alice@school.com', grade: 'Grade 1', subject: 'Mathematics' });
    const t2 = await Teacher.create({ uniqueID: 'T002', name: 'Mr. Bob Kariuki', contact: 'bob@school.com', grade: 'Grade 2', subject: 'English' });
    const t3 = await Teacher.create({ uniqueID: 'T003', name: 'Mrs. Carol Mutiso', contact: 'carol@school.com', grade: 'Grade 1', subject: 'Science' });

    // Create teacher user accounts
    const createTeacherUser = async (teacher, pwd) => {
      const username = `t_${teacher.uniqueID}`;
      const hash = await bcrypt.hash(pwd, 10);
      return User.create({ role: 'teacher', username, password: hash, refId: teacher._id, roleRef: 'Teacher' });
    };
    await createTeacherUser(t1, 'teacher123');
    await createTeacherUser(t2, 'teacher123');
    await createTeacherUser(t3, 'teacher123');

    console.log('Creating parents...');
    const createParent = async (uniqueID, name, contact) => {
      const parent = await Parent.create({ uniqueID, name, contact });
      const username = `p_${uniqueID}`;
      const password = 'parent123';
      const hash = await bcrypt.hash(password, 10);
      await User.create({ role: 'parent', username, password: hash, refId: parent._id, roleRef: 'Parent' });
      return parent;
    };

    // Create more parents for comprehensive testing
    const p1 = await createParent('P001', 'John Murithi', '555-0001');
    const p2 = await createParent('P002', 'Jane Mwakio', '555-0002');
    const p3 = await createParent('P003', 'Michael Were', '555-0003');
    const p4 = await createParent('P004', 'Sarah Were', '555-0004');
    const p5 = await createParent('P005', 'David Wangari', '555-0005');
    const p6 = await createParent('P006', 'Emma Wesonga', '555-0006');

    console.log('Creating students linked to parents and teachers...');

    // Grade 1 students for Ms. Alice Mwawasi (Mathematics)
    const s1 = await Student.create({
      uniqueID: 'S001',
      name: 'Emma Murithi',
      grade: 'Grade 1',
      parentsContact: ['555-0001'],
      parentIDs: [p1._id],
      homeLocation: 'Kileleshwa',
      academicRecords: [{ term: 'Term 1', subject: 'Mathematics', score: 92, remarks: 'Excellent mathematical thinking' }]
    });
    p1.childIDs.push(s1._id);
    await p1.save();

    const s2 = await Student.create({
      uniqueID: 'S002',
      name: 'Liam Mwakio',
      grade: 'Grade 1',
      parentsContact: ['555-0002'],
      parentIDs: [p2._id],
      homeLocation: 'Kileleshwa',
      academicRecords: [{ term: 'Term 1', subject: 'Mathematics', score: 88, remarks: 'Good problem-solving skills' }]
    });
    p2.childIDs.push(s2._id);
    await p2.save();

    const s3 = await Student.create({
      uniqueID: 'S003',
      name: 'Olivia Were',
      grade: 'Grade 1',
      parentsContact: ['555-0003', '555-0004'],
      parentIDs: [p3._id, p4._id],
      homeLocation: 'Upper Hill',
      academicRecords: [{ term: 'Term 1', subject: 'Mathematics', score: 95, remarks: 'Outstanding performance' }]
    });
    p3.childIDs.push(s3._id);
    p4.childIDs.push(s3._id);
    await p3.save();
    await p4.save();

    // Grade 2 students for Mr. Bob Kariuki (English)
    const s4 = await Student.create({
      uniqueID: 'S004',
      name: 'Noah Murithi',
      grade: 'Grade 2',
      parentsContact: ['555-0001'],
      parentIDs: [p1._id],
      homeLocation: 'Upper Hill',
      academicRecords: [{ term: 'Term 1', subject: 'English', score: 85, remarks: 'Good reading comprehension' }]
    });
    p1.childIDs.push(s4._id);
    await p1.save();

    const s5 = await Student.create({
      uniqueID: 'S005',
      name: 'Ava David',
      grade: 'Grade 2',
      parentsContact: ['555-0005'],
      parentIDs: [p5._id],
      homeLocation: 'Westlands',
      academicRecords: [{ term: 'Term 1', subject: 'English', score: 91, remarks: 'Excellent writing skills' }]
    });
    p5.childIDs.push(s5._id);
    await p5.save();

    const s6 = await Student.create({
      uniqueID: 'S006',
      name: 'Ethan Wesonga',
      grade: 'Grade 2',
      parentsContact: ['555-0006'],
      parentIDs: [p6._id],
      homeLocation: 'Westlands',
      academicRecords: [{ term: 'Term 1', subject: 'English', score: 78, remarks: 'Needs improvement in spelling' }]
    });
    p6.childIDs.push(s6._id);
    await p6.save();

    // Grade 1 students for Mrs. Carol Mutiso (Science)
    const s7 = await Student.create({
      uniqueID: 'S007',
      name: 'Sophie David',
      grade: 'Grade 1',
      parentsContact: ['555-0005'],
      parentIDs: [p5._id],
      homeLocation: 'Westlands',
      academicRecords: [{ term: 'Term 1', subject: 'Science', score: 90, remarks: 'Curious and engaged learner' }]
    });
    p5.childIDs.push(s7._id);
    await p5.save();

    const s8 = await Student.create({
      uniqueID: 'S008',
      name: 'Jackson Wesonga',
      grade: 'Grade 1',
      parentsContact: ['555-0006'],
      parentIDs: [p6._id],
      homeLocation: 'Westlands',
      academicRecords: [{ term: 'Term 1', subject: 'Science', score: 87, remarks: 'Good understanding of concepts' }]
    });
    p6.childIDs.push(s8._id);
    await p6.save();

    console.log('\n✅ Seed complete!\n');
    console.log('=== TEST DATA SUMMARY ===\n');
    console.log('TEACHERS (Every teacher has students):');
    console.log('  t_T001 (Ms. Alice Mwawasi) - Grade 1, Mathematics - has 3 students');
    console.log('  t_T002 (Mr. Bob Kariuki) - Grade 2, English - has 3 students');
    console.log('  t_T003 (Mrs. Carol Mutiso) - Grade 1, Science - has 2 students\n');
    console.log('PARENTS (All with linked children):');
    console.log('  p_P001 (John Mureithi, 555-0001) - has 2 children: Emma (G1), Noah (G2)');
    console.log('  p_P002 (Jane Mwakio, 555-0002) - has 1 child: Liam (G1)');
    console.log('  p_P003 (Michael Were, 555-0003) - has 1 child: Olivia (G1)');
    console.log('  p_P004 (Sarah Were, 555-0004) - has 1 child: Olivia (G1)');
    console.log('  p_P005 (David Wangari, 555-0005) - has 2 children: Ava (G2), Sophie (G1)');
    console.log('  p_P006 (Emma Wesonga, 555-0006) - has 2 children: Ethan (G2), Jackson (G1)\n');
    console.log('STUDENTS (All linked to parents and teachers):');
    console.log('  S001 (Emma Murithi, G1) - Parent: John Murithi - Teacher: Ms. Alice Mwawasi (Math)');
    console.log('  S002 (Liam Mwakio, G1) - Parent: Jane Mwakio - Teachers: Ms. Alice Mwawasi (Math), Mrs. Carol Mutiso (Science)');
    console.log('  S003 (Olivia Were, G1) - Parents: Michael Were, Sarah Were - Teachers: Ms. Alice Mwawasi (Math), Mrs. Carol Mutiso (Science)');
    console.log('  S004 (Noah Murithi, G2) - Parent: John Murithi - Teacher: Mr. Bob Kariuki (English)');
    console.log('  S005 (Ava David, G2) - Parent: David Wangari - Teacher: Mr. Bob Kariuki (English)');
    console.log('  S006 (Ethan Wesonga, G2) - Parent: Emma Wesonga - Teacher: Mr. Bob Kariuki (English)');
    console.log('  S007 (Sophie David, G1) - Parent: David Wangari - Teachers: Ms. Alice Mwawasi (Math), Mrs. Carol Mutiso (Science)');
    console.log('  S008 (Jackson Wesonga, G1) - Parent: Emma Wesonga - Teachers: Ms. Alice Mwawasi (Math), Mrs. Carol Mutiso (Science)\n');
    console.log('=== LOGIN CREDENTIALS ===\n');
    console.log('Teachers:');
    console.log('  username: t_T001  password: teacher123');
    console.log('  username: t_T002  password: teacher123');
    console.log('  username: t_T003  password: teacher123\n');
    console.log('Parents:');
    console.log('  username: p_P001  password: parent123');
    console.log('  username: p_P002  password: parent123');
    console.log('  username: p_P003  password: parent123');
    console.log('  username: p_P004  password: parent123');
    console.log('  username: p_P005  password: parent123');
    console.log('  username: p_P006  password: parent123\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
