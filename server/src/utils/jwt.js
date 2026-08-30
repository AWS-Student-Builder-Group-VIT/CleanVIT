const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cleantrack_dev_secret';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, blockId: user.blockId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
