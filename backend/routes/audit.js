const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

// POST - add an audit log entry
router.post('/', async (req, res) => {
  try {
    await db.addLog(req.body.action, req.body.details);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
