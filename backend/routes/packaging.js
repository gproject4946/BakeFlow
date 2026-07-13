const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

router.get('/', async (req, res) => {
  try {
    const items = await db.getAll('Packaging');
    res.json(items.map(strip));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, size, rate, vendor } = req.body;
    const item = {
      id: `pack-${Date.now()}`,
      name,
      type,
      size: size || 'Standard',
      rate: Number(rate) || 0,
      vendor: vendor || 'Unknown',
      deleted: false,
      deletedAt: '',
      rateHistory: [{ date: new Date().toLocaleDateString('en-IN'), timestamp: Date.now(), oldRate: 0, newRate: Number(rate) || 0 }],
    };
    await db.append('Packaging', item);
    await db.addLog('Added Packaging', name);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/rate', async (req, res) => {
  try {
    const rows = await db.getAll('Packaging');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.rate = Number(req.body.rate) || 0;
    row.rateHistory = req.body.rateHistory || row.rateHistory || [];

    await db.updateRow('Packaging', row._rowIndex, row);
    await db.addLog('Updated Packaging Rate', `${row.name}: ₹${row.rate}`);
    res.json(strip(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('Packaging');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.deleted = true;
    row.deletedAt = Date.now();
    await db.updateRow('Packaging', row._rowIndex, row);
    await db.addLog('Deleted Packaging', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/restore', async (req, res) => {
  try {
    const rows = await db.getAll('Packaging');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.deleted = false;
    row.deletedAt = '';
    await db.updateRow('Packaging', row._rowIndex, row);
    await db.addLog('Restored Packaging', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/hard', async (req, res) => {
  try {
    const rows = await db.getAll('Packaging');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    await db.deleteRow('Packaging', row._rowIndex);
    await db.addLog('Hard Deleted Packaging', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function strip(row) { const { _rowIndex, ...rest } = row; return rest; }
module.exports = router;
