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
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/packaging',   require('./routes/packaging'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));
app.use('/api/settings',    require('./routes/settings'));
app.use('/api/audit',       require('./routes/audit'));
app.use('/api/customers',   require('./routes/customers'));
app.use('/api/sales',       require('./routes/sales'));
app.use('/api/invoice',     require('./routes/invoice'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Serve index.html for all other routes ────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// ── Bootstrap ─────────────────────────────────────────────────
async function start() {
  console.log('\n🎂  BakeFlow ERP — Starting...');
  console.log('🔌  Connecting to Google Sheets...');

  try {
    await db.init();
    console.log('✅  Google Sheets connected & schema ready!\n');
    app.listen(PORT, () => {
      console.log(`🚀  Server running → http://localhost:${PORT}`);
      console.log(`📊  BakeFlow ERP is ready!\n`);
    });
  } catch (err) {
    console.error('\n❌  Failed to start server:');
    console.error('   ', err.message);
    console.error('\n💡  Check your .env file — make sure SPREADSHEET_ID and GOOGLE_CREDENTIALS are correct.\n');
    process.exit(1);
  }
}

start();
