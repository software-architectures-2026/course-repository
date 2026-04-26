const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repository');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

async function register({ email, password, full_name = null }) {
  if (!email || !password) {
    const err = new Error('email and password are required');
    err.status = 400;
    throw err;
  }
  const existing = await userRepo.getUserByEmail(email);
  if (existing) {
    const err = new Error('User already exists');
    err.status = 409;
    throw err;
  }
  const password_hash = bcrypt.hashSync(password, 10);
  const created = await userRepo.createUser({ email, password_hash, full_name });
  return created;
}

async function login({ email, password }) {
  if (!email || !password) {
    const err = new Error('email and password are required');
    err.status = 400;
    throw err;
  }
  const user = await userRepo.getUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const ok = bcrypt.compareSync(password, user.password_hash || '');
  if (!ok) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }
  const token = jwt.sign({ user_id: user.user_id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  return { token, expires_in: JWT_EXPIRES_IN, user: { user_id: user.user_id, email: user.email, full_name: user.full_name, status: user.status } };
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload;
  } catch (e) {
    return null;
  }
}

module.exports = {
  register,
  login,
  verifyToken,
};
// Business logic layer: auth service (registration, authentication, token management)

// TODO: implement service methods
