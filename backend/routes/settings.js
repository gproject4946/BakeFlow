const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

// GET all settings as a flat key→value object
router.get('/', async (req, res) => {
  try {
    const rows = await db.getAll('Settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - upsert a setting
router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;
    const rows = await db.getAll('Settings');
    const existing = rows.find(r => r.key === key);

    if (existing) {
      existing.value = value;
      await db.updateRow('Settings', existing._rowIndex, { key, value });
    } else {
      await db.append('Settings', { key, value });
    }
    await db.addLog('Updated Settings', key);
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
