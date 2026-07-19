const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');
const requireRole = require('../middleware/requireRole');

// POST - add audit log entry (enhanced with employee attribution)
router.post('/', async (req, res) => {
  try {
    const { action, details, entityType, entityId } = req.body;
    const employeeName  = req.headers['x-employee-name']  || 'Unknown';
    const employeeEmail = req.headers['x-employee-email'] || '';
    await db.addLog(action, details, employeeName, employeeEmail, entityType || '', entityId || '');
    res.json({ success: true });
  } catch (err) {
    console.error('[audit] POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET - fetch audit log for Reports page (admin or owner)
router.get('/', requireRole(['admin', 'owner']), async (req, res) => {

  try {
    const logs = await db.getAll('AuditLog');
    res.json(logs.reverse());
  } catch (err) {
    console.error('[audit] GET:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
