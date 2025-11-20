# Follow-Up: Real-Time Parent-Teacher Communication Platform
Site-Link: https://follow-up-tau.vercel.app


## Overview

**Follow-Up** is a modern web-based platform designed to streamline communication between parents and teachers in educational institutions. The application enables instant messaging, student record management, and seamless information sharing between school staff and parents.

## Problem Statement

Traditional communication channels between parents and teachers are often fragmented and inefficient:
- Email responses can take days
- Phone calls interrupt classroom instruction
- Physical notes are easily lost
- No centralized record of academic progress
- Lack of real-time updates on student performance

Follow-Up solves these challenges by providing:
✅ **Real-time messaging** between parents and teachers  
✅ **Centralized student records** accessible to relevant parties  
✅ **Role-based access control** for security and privacy  
✅ **Instant notifications** via Socket.io for immediate communication  
✅ **User-friendly interface** accessible on desktop and mobile  

## Tech Stack

### Frontend
- **React 18** with Vite for fast development
- **Socket.io-client** for real-time messaging
- **Axios** for HTTP API requests
- **CSS3** with responsive mobile design

### Backend
- **Node.js & Express.js** for REST API
- **MongoDB & Mongoose** for data persistence
- **JWT (jsonwebtoken)** for authentication
- **Socket.io** for real-time message delivery
- **bcryptjs** for password hashing

### Deployment
- **Render** (Backend hosting)
- **Vercel** (Frontend hosting)
- **MongoDB Atlas** (Cloud database - free tier)

## Project Structure

```
Follow-Up/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Authentication page
│   │   │   ├── ParentDashboard.jsx # Parent interface
│   │   │   └── TeacherDashboard.jsx# Teacher interface
│   │   ├── lib/
│   │   │   └── api.js              # Axios HTTP client with auth
│   │   ├── App.jsx                 # Main app component
│   │   ├── main.jsx                # Entry point
│   │   └── index.css               # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express backend
│   ├── src/
│   │   ├── index.js                # HTTP & Socket.io server
│   │   ├── app.js                  # Express app setup
│   │   ├── config/
│   │   │   └── db.js               # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT authentication
│   │   ├── models/
│   │   │   ├── User.js             # User schema (auth)
│   │   │   ├── Student.js          # Student info & records
│   │   │   ├── Parent.js           # Parent profile
│   │   │   ├── Teacher.js          # Teacher profile
│   │   │   └── Message.js          # Messages between users
│   │   ├── routes/
│   │   │   ├── auth.js             # POST /auth/login
│   │   │   ├── messages.js         # Message CRUD & Socket.io emit
│   │   │   ├── students.js         # Student management
│   │   │   ├── teachers.js         # Teacher management
│   │   │   └── users.js            # User lookup by refId
│   │   └── scripts/
│   │       └── seed.js             # Sample data initialization
│   ├── package.json
│   └── .env.example
│
└── README.md                        # This file
```

## Features

### Authentication
- **Unified Login System**: Single login endpoint for both parents and teachers
- **JWT Tokens**: Secure token-based authentication
- **Role-Based Access**: Parents see child dashboards; teachers see class management
- **Password Security**: bcryptjs hashing with salt rounds = 10

### Parent Dashboard
- **View Children**: List all children enrolled in school
- **Select Child**: Switch between different children to view details
- **Academic Records**: View student's term-by-term academic performance
- **Class Teachers**: See all teachers for the child's grade level
- **Real-Time Messaging**: Send and receive instant messages to/from teachers
- **Message History**: Access previous conversations

### Teacher Dashboard
- **Manage Students**: View all students in your grade level
- **Student Records**: Add and update academic performance records
- **Add Students**: Create new parent-student pairs (enforces max 2 parents per student)
- **Parent Communication**: Message parents about specific students
- **Create Accounts**: Generate credentials for new parents

### Real-Time Messaging
- **Instant Delivery**: Socket.io ensures messages arrive instantly
- **Conversation History**: Load previous messages when opening chat
- **Message Timestamps**: See when each message was sent
- **Auto-scroll**: Automatically scrolls to latest message
- **Enter-to-Send**: Press Enter to send, Shift+Enter for new line
- **Read Status**: Track message delivery (ready for expansion)


## Test Accounts

After running the seed script, test accounts are automatically created. Credentials are displayed in the console output during the seed execution.

- **Parents**: Auto-generated usernames with auto-generated passwords
- **Teachers**: Auto-generated usernames with auto-generated passwords

Check the console output or database for specific login credentials.

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login for both parents and teachers.

**Accepts:** Username and password  
**Returns:** JWT token, user role, and user IDs for authenticated sessions



### Student Endpoints

#### GET /api/students/parent/:parentId
Get all children for a parent.

**Headers:** `Authorization: Bearer <token>`


#### GET /api/students/:studentId
Get detailed student info including academic records.

**Headers:** `Authorization: Bearer <token>`



#### PUT /api/students/:studentId
Update student records (add academic record).

**Headers:** `Authorization: Bearer <token>`



### Teacher Endpoints

#### GET /api/teachers/:teacherId/students
Get all students for a teacher.

**Headers:** `Authorization: Bearer <token>`


#### GET /api/teachers/grade/:grade
Get all teachers for a specific grade.

**Headers:** `Authorization: Bearer <token>`



#### POST /api/teachers/:teacherId/parent-student
Create parent and link to student (enforces max 2 parents).

**Headers:** `Authorization: Bearer <token>`


### Message Endpoints

#### POST /api/messages
Send a message.

**Headers:** `Authorization: Bearer <token>`



#### GET /api/messages/conversation/:otherUserId
Get conversation history with another user.

**Headers:** `Authorization: Bearer <token>`



## Real-Time Messaging

The application uses Socket.io for real-time message delivery between parents and teachers. Messages are instantly delivered when both users are online and stored in the database for offline access.


### User
```javascript
{
  username: String (unique),
  password: String (hashed),
  role: String (enum: ['parent', 'teacher']),
  refId: ObjectId (reference to Parent or Teacher),
  roleRef: String (parent/teacher ID)
}
```

### Student
```javascript
{
  uniqueID: String (unique),
  name: String,
  grade: String,
  homeLocation: String,
  parentIDs: [ObjectId],
  parentsContact: [String],
  academicRecords: [
    {
      term: String,
      subject: String,
      score: Number,
      remarks: String
    }
  ]
}
```

### Parent
```javascript
{
  uniqueID: String (unique),
  name: String,
  contact: String,
  childIDs: [ObjectId]
}
```

### Teacher
```javascript
{
  uniqueID: String (unique),
  name: String,
  contact: String,
  grade: String,
  subject: String
}
```

### Message
```javascript
{
  fromUser: ObjectId (references User),
  toUser: ObjectId (references User),
  student: ObjectId (references Student),
  text: String,
  read: Boolean (default: false),
  createdAt: Date (default: now)
}
```


## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Login with teacher account
- [ ] Login with parent account
- [ ] Invalid credentials show error
- [ ] Tokens persist in localStorage

**Parent Features:**
- [ ] View list of children
- [ ] Select child and view details
- [ ] See academic records
- [ ] View teachers for child's grade
- [ ] Send message to teacher
- [ ] Receive message from teacher
- [ ] Message history loads correctly

**Teacher Features:**
- [ ] View list of students in grade
- [ ] Add academic record to student
- [ ] Create parent and student pair
- [ ] Message parent about student
- [ ] Receive message from parent

**Real-Time Messaging:**
- [ ] Messages delivered instantly
- [ ] Message timestamps display correctly
- [ ] Switching conversations works
- [ ] Enter to send works
- [ ] Old conversation messages load on reopen

## Known Issues & Future Improvements

### Known Issues
- [ ] Messaging sender identification needs refinement on localhost
- [ ] Mobile responsiveness can be further improved
- [ ] Message read status not yet implemented in UI

### Future Enhancements
- [ ] Typing indicators
- [ ] Message read receipts
- [ ] File/image upload
- [ ] Attendance tracking
- [ ] Fee payment integration
- [ ] SMS notifications
- [ ] Dark mode
- [ ] Multi-language support
- [ ] Parent notification preferences
- [ ] Teacher calendar scheduling

## Support & Contact

For issues or questions:
1. Check existing GitHub issues
2. Create new issue with detailed description
3. Include console logs and error messages

## License

MIT License - See LICENSE file for details

## Conclusion

Follow-Up is a scalable, production-ready solution for bridging the communication gap between parents and teachers. Built with modern technologies and deployed on free-tier services, it demonstrates full-stack web development capabilities and real-world problem-solving.

---

**Last Updated**: November 17, 2025  
**Version**: 1.0.0 MVP