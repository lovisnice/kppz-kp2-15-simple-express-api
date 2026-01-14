// src/middleware/csrfMiddleware.js
const csrf = require('csurf');

/*
  CSRF token зберігаємо в cookie.
  Для Postman/небраузерних клієнтів це теж працює, якщо:
  1) Отримати токен з GET /api/csrf-token
  2) Передати його у заголовку: X-CSRF-Token: <token>
  3) Зберегти cookie, які поверне сервер (Postman робить це автоматично у Cookies)
*/
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

module.exports = { csrfProtection };
