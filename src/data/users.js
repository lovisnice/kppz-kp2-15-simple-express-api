// src/data/users.js
// Статичні дані + модель користувачів + імітація JWT (tokens Map)

const users = [
  {
    id: 1,
    username: "admin",
    email: "admin@demo.com",
    password: "admin123",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: "user1",
    email: "user1@demo.com",
    password: "user123",
    role: "user",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    username: "user2",
    email: "user2@demo.com",
    password: "user123",
    role: "user",
    createdAt: new Date().toISOString(),
  },
];

// token -> userId (імітація збереження токенів)
const tokens = new Map();

function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = user;
  return safe;
}

function getAll() {
  return users.map(sanitizeUser);
}

function findById(id) {
  return users.find((u) => u.id === Number(id)) || null;
}

function findByEmail(email) {
  const e = String(email || "").toLowerCase().trim();
  return users.find((u) => u.email.toLowerCase() === e) || null;
}

function create({ username, email, password }) {
  const newUser = {
    id: users.length ? Math.max(...users.map((u) => u.id)) + 1 : 1,
    username: String(username).trim(),
    email: String(email).trim(),
    password: String(password),
    role: "user",
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

function update(id, patch) {
  const user = findById(id);
  if (!user) return null;

  user.username = patch.username !== undefined ? String(patch.username).trim() : user.username;
  user.email = patch.email !== undefined ? String(patch.email).trim() : user.email;
  user.role = patch.role !== undefined ? String(patch.role) : user.role;

  return user;
}

function remove(id) {
  const before = users.length;
  const idx = users.findIndex((u) => u.id === Number(id));
  if (idx >= 0) users.splice(idx, 1);
  return users.length !== before;
}

function checkPassword(user, password) {
  return Boolean(user && user.password === String(password));
}

function generateToken(userId) {
  return `fake-jwt-token-${userId}-${Date.now()}`;
}

function saveToken(userId, token) {
  tokens.set(token, Number(userId));
}

function verifyToken(token) {
  const userId = tokens.get(String(token));
  if (!userId) return null;
  return findById(userId);
}

module.exports = {
  // data access
  getAll,
  findById,
  findByEmail,
  create,
  update,
  remove,

  // auth helpers
  sanitizeUser,
  checkPassword,
  generateToken,
  saveToken,
  verifyToken,
};
