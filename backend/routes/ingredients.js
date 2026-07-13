const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

// GET all ingredients
router.get('/', async (req, res) => {
  try {
    const items = await db.getAll('Ingredients');
    res.json(items.map(strip));
  } catch (err) {
    console.error('[ingredients] GET:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST - add new ingredient
router.post('/', async (req, res) => {
  try {
    const { name, cat, unit, rate } = req.body;
    const item = {
      id: `ing-${Date.now()}`,
      name,
      cat,
      unit,
      rate: Number(rate) || 0,
      updated: new Date().toLocaleDateString('en-IN'),
      deleted: false,
      deletedAt: '',
      rateHistory: [{ date: new Date().toLocaleDateString('en-IN'), timestamp: Date.now(), oldRate: 0, newRate: Number(rate) || 0 }],
    };
    await db.append('Ingredients', item);
    await db.addLog('Added Ingredient', name);
    res.json(item);
  } catch (err) {
    console.error('[ingredients] POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT - update rate (with history)
router.put('/:id/rate', async (req, res) => {
  try {
    const rows = await db.getAll('Ingredients');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.rate = Number(req.body.rate) || 0;
    row.updated = new Date().toLocaleDateString('en-IN');
    row.rateHistory = req.body.rateHistory || row.rateHistory || [];

    await db.updateRow('Ingredients', row._rowIndex, row);
    await db.addLog('Updated Ingredient Rate', `${row.name}: ₹${row.rate}`);
    res.json(strip(row));
  } catch (err) {
    console.error('[ingredients] PUT rate:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('Ingredients');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.deleted = true;
    row.deletedAt = Date.now();
    await db.updateRow('Ingredients', row._rowIndex, row);
    await db.addLog('Deleted Ingredient', row.name);
    res.json({ success: true });
  } catch (err) {
    console.error('[ingredients] DELETE:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST - restore
router.post('/:id/restore', async (req, res) => {
  try {
    const rows = await db.getAll('Ingredients');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    row.deleted = false;
    row.deletedAt = '';
    await db.updateRow('Ingredients', row._rowIndex, row);
    await db.addLog('Restored Ingredient', row.name);
    res.json({ success: true });
  } catch (err) {
    console.error('[ingredients] restore:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - hard delete
router.delete('/:id/hard', async (req, res) => {
  try {
    const rows = await db.getAll('Ingredients');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    await db.deleteRow('Ingredients', row._rowIndex);
    await db.addLog('Hard Deleted Ingredient', row.name);
    res.json({ success: true });
  } catch (err) {
    console.error('[ingredients] hard delete:', err.message);
    res.status(500).json({ error: err.message });
  }
});

function strip(row) {
  const { _rowIndex, ...rest } = row;
  return rest;
}

module.exports = router;
