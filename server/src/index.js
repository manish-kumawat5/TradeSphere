require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const marketRoutes = require('./routes/market.routes');
const watchlistRoutes = require('./routes/watchlist.routes');
const orderRoutes = require('./routes/order.routes');
const fundsRoutes = require('./routes/funds.routes');
const userRoutes = require('./routes/user.routes');
const profileRoutes = require('./routes/profile.routes');

const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// ── Trust Proxy (required behind Railway/Render/Nginx) ───────────────
app.set('trust proxy', 2);

// ── Security Middleware ──────────────────────────────────────────────
app.use(helmet());
const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Global Rate Limiter ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
app.use(globalLimiter);

// ── Body Parsers ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    console.error('JSON parse error for', req.method, req.path);
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  next(err);
});

// ── Request logger (debug POST bodies) ──────────────────────────────
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.includes('/auth/login')) {
    console.log('Login request body:', JSON.stringify(req.body));
  }
  next();
});
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Health Check ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/funds', fundsRoutes);
app.use('/api/notifications', require('./routes/notifications.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/user', userRoutes);
app.use('/api/profile', profileRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ─────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;

// ── Standalone server (for Render / local dev) ───────────────────────
if (!process.env.VERCEL) {
  const http = require('http');
  const server = http.createServer(app);
  const PORT = process.env.PORT || 5003;

  const { WebSocketServer } = require('ws');
  const wss = new WebSocketServer({ server });

  // SIP scheduler removed (was causing DB connection issues at startup)
  // const { startSipScheduler } = require('./services/sipScheduler');
  // startSipScheduler();

  wss.on('connection', (ws) => {
    console.log('Client connected to price feed');
    ws.on('close', () => console.log('Client disconnected'));
  });

  const SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'WIPRO', 'SBIN', 'BAJFINANCE', 'NIFTY50', 'SENSEX', 'BANKNIFTY'];
  const prices = {};
  SYMBOLS.forEach(s => { prices[s] = 1000 + Math.random() * 4000; });

  setInterval(() => {
    SYMBOLS.forEach(sym => {
      const change = (Math.random() - 0.495) * 0.006;
      prices[sym] = parseFloat((prices[sym] * (1 + change)).toFixed(2));
    });
    const payload = JSON.stringify({ type: 'PRICE_TICK', data: prices, ts: Date.now() });
    wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(payload);
    });
  }, 3000);

  global.livePrices = prices;

  server.listen(PORT, () => {
    console.log(`TradeSphere API running on port ${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const newPort = parseInt(PORT) + 1;
      console.warn(`Port ${PORT} in use, switching to ${newPort}`);
      process.env.PORT = newPort;
      server.listen(newPort, () => {
        console.log(`\n🚀 TradeSphere API running on http://localhost:${newPort}`);
        console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
      });
    } else {
      console.error('Server error:', err);
    }
  });
}
