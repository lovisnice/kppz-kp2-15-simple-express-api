// src/routes/auth.js
const express = require("express");
const userModel = require("../data/users");

const router = express.Router();

// middleware: Bearer token
function authenticateToken(req, res, next) {
  const auth = req.headers["authorization"] || "";
  const [type, token] = auth.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing Bearer token" });
  }

  const user = userModel.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = userModel.sanitizeUser(user);
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { username, email, password } = req.body || {};

  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, password are required" });
  }

  if (userModel.findByEmail(email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const user = userModel.create({ username, email, password });
  const token = userModel.generateToken(user.id);
  userModel.saveToken(user.id, token);

  return res.status(201).json({
    user: userModel.sanitizeUser(user),
    token,
  });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = userModel.findByEmail(email);
  if (!user || !userModel.checkPassword(user, password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = userModel.generateToken(user.id);
  userModel.saveToken(user.id, token);

  return res.json({ token });
});

// GET /api/auth/profile (protected)
router.get("/profile", authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

// GET /api/auth/users (admin only)
router.get("/users", authenticateToken, requireAdmin, (req, res) => {
  return res.json({ users: userModel.getAll() });
});

module.exports = {
  router,
  authenticateToken, // експортуємо для products routes
};
