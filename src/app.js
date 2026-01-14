// src/app.js
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const { helmet, securityHeaders } = require('./middleware/securityMiddleware');
const { xssFilterOutput, validateContentType } = require('./middleware/xssFilter');
const { sanitizeInput, preventNoSQLInjection } = require('./middleware/validationMiddleware');
const { apiRateLimiter, authRateLimiter } = require('./middleware/rateLimitMiddleware');
const { csrfProtection } = require('./middleware/csrfMiddleware');
const { checkOriginHeader } = require('./middleware/originCheck');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();

// Безпечні заголовки
app.use(helmet());
app.use(securityHeaders);

// Логування
app.use(morgan('combined'));

// CORS (мінімально безпечно; за потреби обмеж через origin allowlist)
app.use(cors({ credentials: true, origin: true }));

// Cookie parser (для CSRF cookie)
app.use(cookieParser());

// Валідація Content-Type + санація + NoSQL-check
app.use(validateContentType);
app.use(sanitizeInput);
app.use(preventNoSQLInjection);

// Парсинг JSON (як у методичці з limit+verify)
app.use(
  express.json({
    limit: '5mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// XSS захист для вихідних даних
app.use(xssFilterOutput);

// Базовий статус (ти його мав у 2-15 / 2-13)
app.get('/api/status', apiRateLimiter, (req, res) => {
  res.json({ success: true, status: 'ok', time: new Date().toISOString() });
});

// Кореневий маршрут (як у методичці — “Захищений REST API…”)
app.get('/', apiRateLimiter, (req, res) => {
  res.json({
    message: 'Захищений REST API на Express.js',
    version: '2.0.0',
    security: {
      csrf: true,
      xss: true,
      rateLimiting: true,
      sqlInjection: true,
      ddos: true,
    },
  });
});

// Отримання CSRF токена (щоб зручно тестити в Postman)
app.get('/api/csrf-token', apiRateLimiter, csrfProtection, (req, res) => {
  res.json({ success: true, csrfToken: req.csrfToken() });
});

// Маршрути аутентифікації (жорсткіший rate limit + csrf + origin)
app.use('/api/auth', authRateLimiter, csrfProtection, checkOriginHeader, authRoutes);

// Маршрути продуктів (api rate limit + csrf + origin)
app.use('/api/products', apiRateLimiter, csrfProtection, checkOriginHeader, productRoutes);

// Ендпоінт перевірки безпеки (як у методичці)
app.get('/api/security/check', apiRateLimiter, (req, res) => {
  const securityInfo = {
    headers: {
      csp: req.get('Content-Security-Policy') ? 'Встановлено' : 'Відсутній',
      xssProtection: req.get('X-XSS-Protection') ? 'Встановлено' : 'Відсутній',
      contentTypeOptions: req.get('X-Content-Type-Options') ? 'Встановлено' : 'Відсутній',
      frameOptions: req.get('X-Frame-Options') ? 'Встановлено' : 'Відсутній',
    },
    cookies: {
      httponly: 'Встановлено для cookie CSRF',
      secure: process.env.NODE_ENV === 'production' ? 'Так' : 'Тільки для HTTPS',
    },
    rateLimiting: {
      enabled: true,
      limits: {
        auth: '5 запитів за 15 хвилин',
        api: '100 запитів за хвилину',
      },
    },
  };

  res.json({ success: true, security: securityInfo });
});

// 404 (як у методичці — з нотаткою безпеки)
app.use('*', apiRateLimiter, (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Маршрут не знайдено',
    securityNote: 'Всі маршрути захищені',
  });
});

// Error handler (не світимо деталі в production)
app.use((err, req, res, next) => {
  console.error('Помилка:', err.message);

  const errorMessage =
    process.env.NODE_ENV === 'development' ? err.message : 'Внутрішня помилка сервера';

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // CSRF помилка (часта в Postman)
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, message: 'CSRF токен відсутній або некоректний' });
  }

  res.status(500).json({ success: false, message: errorMessage });
});

module.exports = app;
