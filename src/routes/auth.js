// src/routes/auth.js
const express = require('express');
const router = express.Router();

const userModel = require('../data/users');

const {
  validateRequest,
  registerValidation,
  sanitizeInput,
  preventNoSQLInjection,
} = require('../middleware/validationMiddleware');

// Проста генерація фейкового JWT (як у твоєму КП 2-13)
const generateToken = (userId) => `fake-jwt-token-${userId}-${Date.now()}`;

// Middleware: перевірка Bearer
const requireAuth = (req, res, next) => {
  const auth = req.headers.authorization || '';
  if (!auth.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }
  const token = auth.slice(7).trim();
  const user = userModel.findByToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid token' });
  req.user = user;
  next();
};

// Middleware: admin only
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};

// REGISTER (як у методичці: sanitize + nosql + validateRequest)
router.post(
  '/register',
  sanitizeInput,
  preventNoSQLInjection,
  validateRequest(registerValidation),
  (req, res) => {
    try {
      const { username, email, password } = req.body;

      const existingUser = userModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Користувач з таким email вже існує',
        });
      }

      const existingUsername = userModel.getAll().find((u) => u.username === username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Користувач з таким іменем вже існує',
        });
      }

      const newUser = userModel.create({ username, email, password });

      const token = generateToken(newUser.id);
      userModel.saveToken(newUser.id, token);

      res.status(201).json({
        success: true,
        message: 'Користувач успішно зареєстрований',
        token,
        user: newUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при реєстрації',
        error: error.message,
      });
    }
  }
);

// LOGIN (мінімальна санація + nosql)
router.post('/login', sanitizeInput, preventNoSQLInjection, (req, res) => {
  const { email, password } = req.body;
  const user = userModel.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Невірні дані' });
  }
  const token = generateToken(user.id);
  userModel.saveToken(user.id, token);
  res.json({ success: true, token, user });
});

// PROFILE
router.get('/profile', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// USERS ADMIN
router.get('/users', requireAuth, requireAdmin, (req, res) => {
  res.json({ success: true, users: userModel.getAll() });
});

module.exports = router;
