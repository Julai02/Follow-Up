require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const socketio = require('socket.io');

const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI || '');

const server = http.createServer(app);
const io = socketio(server, { cors: { origin: process.env.CLIENT_URL || '*' } });

io.on('connection', (socket) => {
  console.log('Socket connected', socket.id);
  socket.on('join', (room) => { socket.join(room); });
  socket.on('message', (data) => {
    // broadcast to recipient room
    if (data.toUserId) io.to(data.toUserId).emit('message', data);
  });
  socket.on('disconnect', () => { console.log('Socket disconnected', socket.id); });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Improved error handling for common issues (e.g. port in use)
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. This usually means another server is running on that port (nodemon or another Node process).`);
    console.error('To fix: stop the process using that port or start this server on a different port.');
    console.error('On Windows PowerShell you can run:');
    console.error('  netstat -ano | findstr :5000');
    console.error('  taskkill /PID <PID_FROM_PREVIOUS_COMMAND> /F');
    console.error('Or run the server on a different port for this session:');
    console.error('  $env:PORT="5001"; npm run dev');
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
