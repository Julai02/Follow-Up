# Follow-Up: Real-Time Parent-Teacher Communication Platform

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

## Installation & Setup

### Prerequisites
- **Node.js** v16+ and npm/yarn
- **MongoDB Atlas** account (free tier available)
- **Git** for version control

### 1. Clone Repository
```bash
git clone https://github.com/Julai02/Follow-Up.git
cd Follow-Up
```

### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/followup?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_12345
CLIENT_URL=http://localhost:5173
PORT=5000
EOF

# Run seed script to populate sample data
npm run seed

# Start development server
npm run dev
```

**Backend runs on:** http://localhost:5000

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create .env file
cat > .env.local << EOF
VITE_API_URL=http://localhost:5000/api
EOF

# Start development server
npm run dev
```

**Frontend runs on:** http://localhost:5173

## Test Accounts

After running the seed script, use these credentials:

**Teachers:**
- Username: `t_T001` | Password: `teacher123`
- Username: `t_T002` | Password: `teacher123`
- Username: `t_T003` | Password: `teacher123`

**Parents:**
- Username: `p_P001` | Password: `parent123`
- Username: `p_P002` | Password: `parent123`
- Username: `p_P003` | Password: `parent123`
- Username: `p_P004` | Password: `parent123`

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login for both parents and teachers.

**Request:**
```json
{
  "username": "t_T001",
  "password": "teacher123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "teacher",
  "userId": "691abcbc9ff06ced09bfb133",
  "refId": "691abcbb9ff06ced09bfb12c"
}
```

### Student Endpoints

#### GET /api/students/parent/:parentId
Get all children for a parent.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "children": [
    {
      "_id": "691abcbf9ff06ced09bfb149",
      "name": "Child Name",
      "grade": "Grade 1",
      "homeLocation": "123 Street"
    }
  ]
}
```

#### GET /api/students/:studentId
Get detailed student info including academic records.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "student": {
    "_id": "691abcbf9ff06ced09bfb149",
    "name": "Child Name",
    "grade": "Grade 1",
    "homeLocation": "123 Street",
    "academicRecords": [
      {
        "term": "Term 1",
        "subject": "Mathematics",
        "score": 85,
        "remarks": "Good performance"
      }
    ],
    "parentIDs": ["691abcbd9ff06ced09bfb139"]
  }
}
```

#### PUT /api/students/:studentId
Update student records (add academic record).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "academicRecords": [
    {
      "term": "Term 1",
      "subject": "Mathematics",
      "score": 85,
      "remarks": "Good performance"
    }
  ]
}
```

### Teacher Endpoints

#### GET /api/teachers/:teacherId/students
Get all students for a teacher.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "students": [
    {
      "_id": "691abcbf9ff06ced09bfb149",
      "name": "Student Name",
      "grade": "Grade 1"
    }
  ]
}
```

#### GET /api/teachers/grade/:grade
Get all teachers for a specific grade.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "teachers": [
    {
      "teacher": {
        "_id": "691abcbb9ff06ced09bfb12c",
        "name": "Teacher Name",
        "subject": "Mathematics"
      },
      "user": {
        "_id": "691abcbc9ff06ced09bfb133"
      }
    }
  ]
}
```

#### POST /api/teachers/:teacherId/parent-student
Create parent and link to student (enforces max 2 parents).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "parentData": {
    "uniqueID": "P001",
    "name": "Parent Name",
    "contact": "+1234567890"
  },
  "studentData": {
    "uniqueID": "S001",
    "name": "Student Name",
    "grade": "Grade 1",
    "homeLocation": "123 Street"
  }
}
```

### Message Endpoints

#### POST /api/messages
Send a message.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "toUserId": "691abcbc9ff06ced09bfb133",
  "text": "Hello, how is the child doing?",
  "studentId": "691abcbf9ff06ced09bfb149"
}
```

**Response (200 OK):**
```json
{
  "message": {
    "_id": "691ad7c2f2895b71789324d4",
    "fromUser": {
      "_id": "691abcbd9ff06ced09bfb13b",
      "username": "p_P001",
      "role": "parent"
    },
    "toUser": {
      "_id": "691abcbc9ff06ced09bfb133",
      "username": "t_T001",
      "role": "teacher"
    },
    "text": "Hello, how is the child doing?",
    "student": "691abcbf9ff06ced09bfb149",
    "createdAt": "2025-11-17T08:07:30.214Z",
    "read": false
  }
}
```

#### GET /api/messages/conversation/:otherUserId
Get conversation history with another user.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "messages": [
    {
      "_id": "691ad7c2f2895b71789324d4",
      "fromUser": {
        "_id": "691abcbd9ff06ced09bfb13b",
        "username": "p_P001"
      },
      "toUser": {
        "_id": "691abcbc9ff06ced09bfb133",
        "username": "t_T001"
      },
      "text": "Hello teacher",
      "createdAt": "2025-11-17T08:07:30.214Z"
    }
  ]
}
```

## Socket.io Events

### Connection
```javascript
const socket = io('http://localhost:5000')

// Join your user room (allows others to message you)
socket.emit('join', userId)
```

### Receiving Messages
```javascript
socket.on('message', (msg) => {
  console.log('Message received:', msg)
  // msg contains: { _id, fromUser, toUser, text, createdAt }
})
```

### Server Emit
When a message is sent via POST /api/messages, the server automatically:
1. Saves the message to MongoDB
2. Emits to sender's room (so they see their own message)
3. Emits to recipient's room (so recipient sees it instantly)

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000/api
```

## Database Schemas

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

## Deployment Guide

### Deploy Backend to Render

1. **Create Render Account**: https://render.com
2. **Create New Web Service**:
   - Connect GitHub repo (Julai02/Follow-Up)
   - Runtime: Node
   - Build Command: `cd server && npm install`
   - Start Command: `node src/index.js`
3. **Add Environment Variables**:
   - MONGO_URI: (from MongoDB Atlas)
   - JWT_SECRET: (create secure key)
   - CLIENT_URL: (your Vercel frontend URL)
   - PORT: 5000
4. **Deploy**: Render auto-deploys on push to main

### Deploy Frontend to Vercel

1. **Create Vercel Account**: https://vercel.com
2. **Import Project**:
   - Select Follow-Up repo
   - Framework: Vite
   - Root Directory: `client`
3. **Add Environment Variables**:
   - VITE_API_URL: (your Render backend URL)
4. **Deploy**: Vercel auto-deploys on push to main

### Configure MongoDB Atlas

1. **Create MongoDB Atlas Cluster**: https://www.mongodb.com/cloud/atlas
2. **Create Database User**: Note username and password
3. **Get Connection String**: Copy MongoDB URI
4. **Add to .env**: 
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/followup?retryWrites=true&w=majority
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