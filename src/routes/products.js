// src/routes/products.js
const express = require('express');
const router = express.Router();

const productModel = require('../data/products');
const userModel = require('../data/users');

const { validateRequest, productValidation, sanitizeInput, preventNoSQLInjection } =
  require('../middleware/validationMiddleware');

const { createProductLimiter } = require('../middleware/rateLimitMiddleware');

// Auth middleware (той самий принцип що в auth.js)
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

// LIST
router.get('/', (req, res) => {
  const list = productModel.getAll();
  res.json({ success: true, products: list });
});

// ONE
router.get('/:id', (req, res) => {
  const product = productModel.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, product });
});

// CREATE (auth + create limiter + sanitize + nosql + validate)
router.post(
  '/',
  requireAuth,
  createProductLimiter,
  sanitizeInput,
  preventNoSQLInjection,
  validateRequest(productValidation),
  (req, res) => {
    const created = productModel.create({
      ...req.body,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ success: true, product: created });
  }
);

// UPDATE (auth + validate)
router.put(
  '/:id',
  requireAuth,
  sanitizeInput,
  preventNoSQLInjection,
  validateRequest(productValidation),
  (req, res) => {
    const existing = productModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

    // Дозволяємо редагувати лише власний продукт (або admin)
    if (existing.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const updated = productModel.update(req.params.id, req.body);
    res.json({ success: true, product: updated });
  }
);

// DELETE
router.delete('/:id', requireAuth, (req, res) => {
  const existing = productModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Not found' });

  if (existing.createdBy !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const ok = productModel.delete(req.params.id);
  res.json({ success: true, deleted: ok });
});

// MY PRODUCTS
router.get('/user/my-products', requireAuth, (req, res) => {
  const mine = productModel.getByUser(req.user.id);
  res.json({ success: true, products: mine });
});

module.exports = router;
