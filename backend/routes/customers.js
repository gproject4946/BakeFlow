const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

function strip(row) { const { _rowIndex, ...rest } = row; return rest; }
function emp(req) { return { name: req.headers['x-employee-name']||'Unknown', email: req.headers['x-employee-email']||'' }; }

// GET all customers
router.get('/', async (req, res) => {
  try {
    const customers = await db.getAll('Customers');
    const invoices = await db.getAll('SalesInvoices');

    // Filter active customers
    const activeCustomers = customers.filter(c => !c.deleted);

    // Re-calculate statistics dynamically to resolve historical data mismatches
    for (const cust of activeCustomers) {
      const custInvoices = invoices.filter(inv => inv.customerId === cust.id && !inv.deleted);
      
      const actualOrders = custInvoices.length;
      const actualValue = custInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
      
      let actualLastOrder = '';
      if (custInvoices.length > 0) {
        // Sort by timestamp descending
        const sortedInvoices = [...custInvoices].sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
        actualLastOrder = sortedInvoices[0].date || '';
      }

      // Check if values in database are different, and update them if needed to self-heal
      if (Number(cust.totalOrders) !== actualOrders || Number(cust.totalValue) !== actualValue || cust.lastOrderDate !== actualLastOrder) {
        cust.totalOrders = actualOrders;
        cust.totalValue = actualValue;
        cust.lastOrderDate = actualLastOrder;
        try {
          await db.updateRow('Customers', cust._rowIndex, cust);
        } catch (updateErr) {
          console.warn(`Self-heal update failed for customer ${cust.name}:`, updateErr.message);
        }
      }
    }

    res.json(activeCustomers.map(strip));
  } catch (err) {
    console.error('[customers] GET:', err.message);
    res.status(500).json({ error: err.message });
  }
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
