const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (roles = []) => async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    console.log(`[AUTH] Header present: ${!!header}, Required roles: [${roles.join(',')}]`);
    if (!header) return res.status(401).json({ message: 'No token' });
    const token = header.replace('Bearer ', '');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`[AUTH] Token decoded: id=${payload.id}, role=${payload.role}`);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'Invalid token' });
    console.log(`[AUTH] User found: id=${user._id}, role=${user.role}`);
    if (roles.length && !roles.includes(user.role)) {
      console.log(`[AUTH] DENIED: user role '${user.role}' not in required roles [${roles.join(',')}]`);
      return res.status(403).json({ message: 'Forbidden - insufficient permissions' });
    }
    console.log(`[AUTH] ALLOWED: user role '${user.role}' matches required roles`);
    req.user = user;
    next();
  } catch (err) {
    console.error('[AUTH] Error:', err.message);
    res.status(401).json({ message: 'Auth failed' });
  }
};

module.exports = auth;
