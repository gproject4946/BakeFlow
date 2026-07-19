// ============================================================
// BakeFlow ERP — Express Server Entry Point
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./sheets/sheetsClient');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Increased for base64 image uploads
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Apply JWT authentication globally to all secure api endpoints
const requireAuth = require('./middleware/auth');
const { tenantMiddleware } = require('./middleware/tenantContext');
app.use('/api', requireAuth, tenantMiddleware);

app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/packaging',   require('./routes/packaging'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/audit',       require('./routes/audit'));
app.use('/api/customers',   require('./routes/customers'));
app.use('/api/sales',       require('./routes/sales'));
app.use('/api/invoice',     require('./routes/invoice'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/team',        require('./routes/team'));
app.use('/api/api-keys',    require('./routes/apiKeys'));
app.use('/api/export',      require('./routes/export'));

// ── Public REST API (API-key authenticated, no JWT required) ──
app.use('/v1',              require('./routes/publicApi'));


// ── Admin SPA ────────────────────────────────────────────────
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/index.html')));
app.get('/admin/*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/admin/index.html')));

// ── Team Access page ─────────────────────────────────────────
app.get('/team', (req, res) => res.sendFile(path.join(__dirname, '../frontend/team.html')));

// ── Self-serve signup ────────────────────────────────────────
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../frontend/signup.html')));

// ── Serve index.html for all other routes ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// ── Bootstrap ─────────────────────────────────────────────────
async function start() {
  console.log('\n🎂  BakeFlow ERP — Starting...');
  console.log('🔌  Connecting to PostgreSQL (Neon)...');

  try {
    await db.init();
    console.log('✅  PostgreSQL connected & schema ready!\n');
    app.listen(PORT, () => {
      console.log(`🚀  Server running → http://localhost:${PORT}`);
      console.log(`📊  BakeFlow ERP is ready!\n`);
    });
  } catch (err) {
    console.error('\n❌  Failed to start server:');
    console.error('   ', err.message);
    console.error('\n💡  Check your .env file — make sure DATABASE_URL is set correctly.\n');
    process.exit(1);
  }
}

start();
