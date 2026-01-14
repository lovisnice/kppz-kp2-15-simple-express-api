// src/middleware/validationMiddleware.js
const { body, validationResult } = require('express-validator');
const validator = require('validator');

// Універсальна обгортка для express-validator
const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилка валідації',
        errors: errors.array(),
      });
    }

    next();
  };
};

// Валідація для реєстрації
const registerValidation = [
  body('username')
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Ім'я користувача обов'язкове")
    .isLength({ min: 3, max: 30 })
    .withMessage("Ім'я має бути 3-30 символів"),
  body('email').trim().isEmail().withMessage('Некоректний email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль має бути мінімум 6 символів')
    .matches(/\d/)
    .withMessage('Пароль має містити хоча б одну цифру'),
];

// Валідація для продуктів (категорії — як у методичці)
const productValidation = [
  body('name')
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Назва продукту обов'язкова")
    .isLength({ max: 100 })
    .withMessage('Назва не повинна перевищувати 100 символів'),

  body('description')
    .trim()
    .escape()
    .notEmpty()
    .withMessage("Опис продукту обов'язковий")
    .isLength({ max: 500 })
    .withMessage('Опис не повинен перевищувати 500 символів'),

  body('price').isFloat({ min: 0 }).withMessage('Ціна має бути позитивним числом').toFloat(),

  body('category')
    .isIn(['electronics', 'clothing', 'books', 'food', 'other'])
    .withMessage('Невірна категорія'),

  body('quantity').optional().isInt({ min: 0 }).withMessage("Кількість не може бути від'ємною").toInt(),
];

// Санація body/query/params
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = validator.escape(obj[key]);
          obj[key] = obj[key].replace(
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            ''
          );
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      }
    }
    return obj;
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

// Захист від NoSQL ін'єкцій
const preventNoSQLInjection = (req, res, next) => {
  const checkForInjection = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      const value = obj[key];

      if (typeof value === 'string') {
        const mongoOperators = [
          '$where',
          '$ne',
          '$gt',
          '$gte',
          '$lt',
          '$lte',
          '$in',
          '$nin',
          '$and',
          '$or',
          '$not',
          '$nor',
          '$exists',
          '$type',
          '$mod',
          '$regex',
          '$text',
          '$expr',
          '$jsonSchema',
          '$all',
          '$elemMatch',
          '$size',
        ];

        for (const op of mongoOperators) {
          if (value.includes(op)) {
            return res.status(400).json({
              success: false,
              message: 'Потенційно небезпечний запит',
            });
          }
        }

        if (/[\$\[\]\{\}]/.test(value)) {
          obj[key] = value.replace(/[\$\[\]\{\}]/g, '');
        }
      } else if (typeof value === 'object') {
        checkForInjection(value);
      }
    }
  };

  checkForInjection(req.body);
  checkForInjection(req.query);

  next();
};

module.exports = {
  validateRequest,
  registerValidation,
  productValidation,
  sanitizeInput,
  preventNoSQLInjection,
};
