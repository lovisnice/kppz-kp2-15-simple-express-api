// src/middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');

// API: 100 запитів за хвилину
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Забагато запитів. Спробуйте пізніше.' },
});

// AUTH: 5 запитів за 15 хвилин
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Забагато спроб. Спробуйте через 15 хвилин.' },
});

// CREATE: 10 запитів за годину
const createProductLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Ліміт створення продуктів вичерпано. Спробуйте пізніше.' },
});

module.exports = {
  apiRateLimiter,
  authRateLimiter,
  createProductLimiter,
};
