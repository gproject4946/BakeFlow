const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

function strip(row) { const { _rowIndex, ...rest } = row; return rest; }
function emp(req) { return { name: req.headers['x-employee-name']||'Unknown', email: req.headers['x-employee-email']||'' }; }

// GET all customers
router.get('/', async (req, res) => {
  try {
    const items = await db.getAll('Customers');
    res.json(items.filter(c => !c.deleted).map(strip));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST - add customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, city, address, notes } = req.body;
    const e = emp(req);
    const item = {
      id: `cust-${Date.now()}`,
      name, phone, email: email||'', city: city||'', address: address||'', notes: notes||'',
      totalOrders: 0, totalValue: 0, lastOrderDate: '',
      addedBy: e.name, addedByEmail: e.email,
      createdAt: new Date().toLocaleDateString('en-IN'),
      deleted: false, deletedAt: ''
    };
    await db.append('Customers', item);
    await db.addLog('ADD_CUSTOMER', name, e.name, e.email, 'Customer', item.id);
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT - update customer
router.put('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('Customers');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const e = emp(req);
    Object.assign(row, req.body);
    await db.updateRow('Customers', row._rowIndex, row);
    await db.addLog('UPDATE_CUSTOMER', row.name, e.name, e.email, 'Customer', row.id);
    res.json(strip(row));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('Customers');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const e = emp(req);
    row.deleted = true;
    row.deletedAt = Date.now();
    await db.updateRow('Customers', row._rowIndex, row);
    await db.addLog('DELETE_CUSTOMER', row.name, e.name, e.email, 'Customer', row.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
