// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { router: authRoutes } = require("./routes/auth");
const productRoutes = require("./routes/products");

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    name: "KP 2-15 REST API (Express)",
    endpoints: {
      status: "GET /api/status",
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        profile: "GET /api/auth/profile (Bearer)",
        users_admin: "GET /api/auth/users (Bearer + admin)",
      },
      products: {
        list: "GET /api/products?category=&inStock=&q=&sort=&page=&limit=",
        one: "GET /api/products/:id",
        create: "POST /api/products (Bearer)",
        update: "PUT /api/products/:id (Bearer; owner/admin)",
        delete: "DELETE /api/products/:id (Bearer; owner/admin)",
        my: "GET /api/products/user/my-products (Bearer)",
      },
    },
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    time: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`KP2-15 API running on http://localhost:${PORT}`));
