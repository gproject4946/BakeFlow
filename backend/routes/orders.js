const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

// GET all orders
router.get('/', async (req, res) => {
  try {
    const rows = await db.getAll('Orders');
    const orders = rows.map(row => {
      const order = (typeof row.orderData === 'object' && row.orderData) ? row.orderData : {};
      return {
        ...order,
        id: row.id || order.id,
        deleted: row.deleted === true,
        deletedAt: row.deletedAt || undefined,
      };
    }).filter(o => o.id);
    res.json(orders);
  } catch (err) {
    console.error('[orders] GET:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST - save or update order
router.post('/', async (req, res) => {
  try {
    const order = req.body;
    if (!order.id) order.id = `order-${Date.now()}`;

    const rows = await db.getAll('Orders');
    const existing = rows.find(r => r.id === order.id);

    const rowData = {
      id: order.id,
      name: order.name || '',
      category: order.category || '',
      date: order.date || new Date().toLocaleDateString('en-IN'),
      timestamp: order.timestamp || Date.now(),
      orderData: order,
      deleted: order.deleted ? 'true' : '',
      deletedAt: order.deletedAt || '',
    };

    if (existing) {
      await db.updateRow('Orders', existing._rowIndex, rowData);
      await db.addLog('Updated Order', order.name);
    } else {
      await db.append('Orders', rowData);
      await db.addLog('Saved Order', order.name);
    }

    res.json(order);
  } catch (err) {
    console.error('[orders] POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('Orders');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    const order = (typeof row.orderData === 'object' && row.orderData) ? row.orderData : {};
    order.deleted = true;
    order.deletedAt = Date.now();

    await db.updateRow('Orders', row._rowIndex, {
      id: row.id, name: row.name, category: row.category,
      date: row.date, timestamp: row.timestamp,
      orderData: order, deleted: 'true', deletedAt: Date.now(),
    });
    await db.addLog('Deleted Order', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - restore
router.post('/:id/restore', async (req, res) => {
  try {
    const rows = await db.getAll('Orders');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    const order = (typeof row.orderData === 'object' && row.orderData) ? row.orderData : {};
    delete order.deleted;
    delete order.deletedAt;

    await db.updateRow('Orders', row._rowIndex, {
      id: row.id, name: row.name, category: row.category,
      date: row.date, timestamp: row.timestamp,
      orderData: order, deleted: '', deletedAt: '',
    });
    await db.addLog('Restored Order', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - hard delete
router.delete('/:id/hard', async (req, res) => {
  try {
    const rows = await db.getAll('Orders');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });

    await db.deleteRow('Orders', row._rowIndex);
    await db.addLog('Hard Deleted Order', row.name);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
