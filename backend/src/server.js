require('dotenv').config();
const path         = require('path');
const express      = require('express');
const cookieParser = require('cookie-parser');
const cors         = require('cors');

const authRoutes       = require('./routes/auth.routes');
const usersRoutes      = require('./routes/users.routes');
const productsRoutes   = require('./routes/products.routes');
const inventoryRoutes  = require('./routes/inventory.routes');
const ordersRoutes     = require('./routes/orders.routes');
const productionRoutes = require('./routes/production.routes');
const reportsRoutes    = require('./routes/reports.routes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

// Serve product images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/users',      usersRoutes);
app.use('/api/products',   productsRoutes);
app.use('/api/inventory',  inventoryRoutes);
app.use('/api/orders',     ordersRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/reports',    reportsRoutes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'bakeflow-api' }));

// ── Global error handler ──────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀  BakeFlow API running on http://localhost:${PORT}`);
});
