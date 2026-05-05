const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (roles = []) => async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] Header present: ${!!header}, Required roles: [${roles.join(',')}]`);
    }
    if (!header) return res.status(401).json({ message: 'No token' });
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] Token decoded: id=${payload.id}, role=${payload.role}`);
    }
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] User found: id=${user._id}, role=${user.role}`);
    }
    if (roles.length && !roles.includes(user.role)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[AUTH] DENIED: user role '${user.role}' not in required roles [${roles.join(',')}]`);
      }
      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] ALLOWED: user role '${user.role}' matches required roles`);
    }
    req.user = user;
    req.user.userId = user._id;
    req.user.id = user._id;
    next();
  } catch (err) {
    console.error('[AUTH] Error:', err.message);
    res.status(401).json({ message: 'Auth failed' });
  }
};

module.exports = auth;
