const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');
const requireRole = require('../middleware/requireRole');

// Require admin/owner role for exporting data
router.use(requireRole(['admin', 'owner']));

// Helper function to convert JSON objects to CSV string
function jsonToCsv(items, fields) {
  if (items.length === 0) {
    return fields.join(',') + '\n';
  }
  
  const header = fields.join(',');
  const rows = items.map(item => {
    return fields.map(fieldName => {
      let val = item[fieldName];
      if (val === null || val === undefined) {
        val = '';
      } else if (typeof val === 'object') {
        val = JSON.stringify(val);
      } else {
        val = String(val);
      }
      // Escape double quotes and wrap in quotes if contains comma, quote, or newline
      const escaped = val.replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n') || escaped.includes('\r')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

// GET /api/export/ingredients
router.get('/ingredients', async (req, res) => {
  try {
    const list = await db.prisma.ingredient.findMany({
      where: { tenantId: req.user.tenantId, deleted: false }
    });
    
    const csv = jsonToCsv(list, ['id', 'name', 'cat', 'unit', 'rate', 'stockQty', 'minAlert']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=ingredients_export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/packaging
router.get('/packaging', async (req, res) => {
  try {
    const list = await db.prisma.packaging.findMany({
      where: { tenantId: req.user.tenantId, deleted: false }
    });
    
    const csv = jsonToCsv(list, ['id', 'name', 'type', 'size', 'rate', 'vendor', 'stockQty', 'minAlert']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=packaging_export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/products
router.get('/products', async (req, res) => {
  try {
    const list = await db.prisma.product.findMany({
      where: { tenantId: req.user.tenantId, deleted: false }
    });
    
    const csv = jsonToCsv(list, ['id', 'name', 'cat', 'emoji', 'cost', 'sell', 'margin']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products_export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/sales
router.get('/sales', async (req, res) => {
  try {
    const list = await db.prisma.salesInvoice.findMany({
      where: { tenantId: req.user.tenantId, deleted: false }
    });
    
    const csv = jsonToCsv(list, ['id', 'invoiceNumber', 'customerName', 'customerPhone', 'customerCity', 'subtotal', 'discountAmt', 'gstAmt', 'totalAmount', 'paymentMethod', 'date', 'timestamp', 'createdBy']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales_export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/customers
router.get('/customers', async (req, res) => {
  try {
    const list = await db.prisma.customer.findMany({
      where: { tenantId: req.user.tenantId, deleted: false }
    });
    
    const csv = jsonToCsv(list, ['id', 'name', 'phone', 'email', 'city', 'address', 'totalOrders', 'totalValue', 'lastOrderDate', 'createdAt']);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=customers_export.csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
