// src/middleware/originCheck.js
const DEFAULT_ALLOWED = ['http://localhost:3000', 'http://localhost:5000'];

const getAllowedOrigins = () => {
  const fromEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return [...new Set([...DEFAULT_ALLOWED, ...fromEnv])];
};

const checkOriginHeader = (req, res, next) => {
  const origin = req.headers.origin;

  // Postman/CLI часто не передає Origin — дозволяємо
  if (!origin) return next();

  const allowed = getAllowedOrigins();
  if (!allowed.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origin заборонений',
    });
  }

  next();
};

module.exports = { checkOriginHeader };
