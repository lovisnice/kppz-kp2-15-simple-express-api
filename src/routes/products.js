// src/routes/products.js
const express = require("express");
const productModel = require("../data/products");
const userModel = require("../data/users");
const { authenticateToken } = require("./auth");

const router = express.Router();

// GET /api/products (public) + filters/sort/pagination
router.get("/", (req, res) => {
  const data = productModel.getAll(req.query || {});
  return res.json(data);
});

// ВАЖЛИВО: цей маршрут має бути ВИЩЕ, ніж "/:id"
router.get("/user/my-products", authenticateToken, (req, res) => {
  const mine = productModel.getByUser(req.user.id);
  return res.json({ items: mine });
});

// GET /api/products/:id (public)
router.get("/:id", (req, res) => {
  const p = productModel.findById(req.params.id);
  if (!p) return res.status(404).json({ error: "Product not found" });
  return res.json(p);
});

// POST /api/products (protected)
router.post("/", authenticateToken, (req, res) => {
  const { name, price } = req.body || {};

  if (!name || price === undefined) {
    return res.status(400).json({ error: "name and price are required" });
  }

  const created = productModel.create({
    ...req.body,
    createdBy: req.user.id,
  });

  return res.status(201).json(created);
});

// PUT /api/products/:id (protected, owner or admin)
router.put("/:id", authenticateToken, (req, res) => {
  const existing = productModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const isOwner = existing.createdBy === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "No permission" });

  const updated = productModel.update(req.params.id, req.body || {});
  return res.json(updated);
});

// DELETE /api/products/:id (protected, owner or admin)
router.delete("/:id", authenticateToken, (req, res) => {
  const existing = productModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Product not found" });

  const isOwner = existing.createdBy === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) return res.status(403).json({ error: "No permission" });

  const ok = productModel.remove(req.params.id);
  return res.json({ deleted: ok });
});

module.exports = router;
