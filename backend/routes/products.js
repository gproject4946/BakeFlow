const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

router.get('/', async (req, res) => {
  try {
    const items = await db.getAll('Products');
    res.json(items.map(strip));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, cat, emoji, cost, sell } = req.body;
    const costN = Number(cost) || 0;
    const sellN = Number(sell) || 0;
    const margin = costN > 0 ? Math.round(((sellN - costN) / costN) * 100) : 0;
    const item = {
      id: `prod-${Date.now()}`,
      name, cat,
      emoji: emoji || '🎂',
      cost: costN,
      sell: sellN,
      margin,
      deleted: false,
      deletedAt: '',
    };
    await db.append('Products', item);
    await db.addLog('Added Product', name);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('Products');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.deleted = true;
    row.deletedAt = Date.now();
    await db.updateRow('Products', row._rowIndex, row);
    await db.addLog('Deleted Product', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/restore', async (req, res) => {
  try {
    const rows = await db.getAll('Products');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.deleted = false;
    row.deletedAt = '';
    await db.updateRow('Products', row._rowIndex, row);
    await db.addLog('Restored Product', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id/hard', async (req, res) => {
  try {
    const rows = await db.getAll('Products');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    await db.deleteRow('Products', row._rowIndex);
    await db.addLog('Hard Deleted Product', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function strip(row) { const { _rowIndex, ...rest } = row; return rest; }
module.exports = router;
