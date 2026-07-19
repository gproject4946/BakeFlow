const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../sheets/sheetsClient');
const { tenantStorage } = require('../middleware/tenantContext');

// ── API Key Authentication Middleware ──────────────────────────────────────
// Reads X-API-Key header, verifies against SHA-256 hash in DB,
// sets tenantId context for the request
async function apiKeyAuth(req, res, next) {
  const rawKey = req.headers['x-api-key'];
  if (!rawKey) {
    return res.status(401).json({ error: 'Missing X-API-Key header' });
  }

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  try {
    const apiKey = await db.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: { select: { id: true, status: true } } }
    });

    if (!apiKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (apiKey.tenant.status === 'suspended') {
      return res.status(403).json({ error: 'This bakery account is suspended' });
    }

    // Attach tenant context so scoped queries work correctly
    req.tenantId = apiKey.tenant.id;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Helper: run handler inside tenant context scope
function withTenant(tenantId, fn) {
  return tenantStorage.run({ tenantId }, fn);
}

router.use(apiKeyAuth);

// ── GET /v1/products
// Returns published product catalog for this bakery
router.get('/products', async (req, res) => {
  await withTenant(req.tenantId, async () => {
    try {
      const products = await db.prisma.product.findMany({
        where: { deleted: false },
        select: {
          id: true,
          name: true,
          cat: true,
          emoji: true,
          sell: true,
          cost: true,
          margin: true
        },
        orderBy: { name: 'asc' }
      });
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ── GET /v1/stock
// Returns current ingredient and packaging stock levels
router.get('/stock', async (req, res) => {
  await withTenant(req.tenantId, async () => {
    try {
      const [ingredients, packaging] = await Promise.all([
        db.prisma.ingredient.findMany({
          where: { deleted: false },
          select: { id: true, name: true, unit: true, stockQty: true, minAlert: true }
        }),
        db.prisma.packaging.findMany({
          where: { deleted: false },
          select: { id: true, name: true, type: true, stockQty: true, minAlert: true }
        })
      ]);

      res.json({
        ingredients: ingredients.map(i => ({
          ...i,
          lowStock: i.stockQty <= i.minAlert
        })),
        packaging: packaging.map(p => ({
          ...p,
          lowStock: p.stockQty <= p.minAlert
        }))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ── POST /v1/orders
// Place an order from an external website — creates a SalesInvoice in BakeFlow
router.post('/orders', async (req, res) => {
  const { customerName, customerPhone, customerCity, items, notes } = req.body;

  if (!customerName || !customerPhone || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customerName, customerPhone, and items[] are required' });
  }

  await withTenant(req.tenantId, async () => {
    try {
      // Compute totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += (item.price || 0) * (item.qty || 1);
      }

      // Get next invoice number atomically
      const invoiceNumber = await db.nextInvoiceNumber();

      const invoice = await db.prisma.salesInvoice.create({
        data: {
          tenantId: req.tenantId,
          invoiceNumber,
          customerName,
          customerPhone,
          customerCity: customerCity || '',
          items,
          subtotal,
          totalAmount: subtotal,
          paymentMethod: 'Online',
          notes: notes || 'Order placed via website integration',
          date: new Date().toLocaleDateString('en-IN'),
          timestamp: Date.now(),
          createdBy: 'Website API',
          createdByEmail: 'api@bakeflow'
        }
      });

      // Fire webhook if configured (non-blocking)
      fireWebhook(req.tenantId, 'order.placed', {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalAmount: invoice.totalAmount,
        items: invoice.items
      });

      res.status(201).json({
        success: true,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ── GET /v1/orders/:invoiceNumber/status
// Check status of a placed order
router.get('/orders/:invoiceNumber/status', async (req, res) => {
  await withTenant(req.tenantId, async () => {
    try {
      const invoice = await db.prisma.salesInvoice.findFirst({
        where: { invoiceNumber: req.params.invoiceNumber, deleted: false },
        select: {
          invoiceNumber: true,
          customerName: true,
          totalAmount: true,
          paymentMethod: true,
          date: true,
          inventoryDeducted: true
        }
      });

      if (!invoice) return res.status(404).json({ error: 'Order not found' });
      res.json(invoice);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ── Webhook Dispatch (non-blocking fire-and-forget) ────────────────────────
async function fireWebhook(tenantId, event, payload) {
  try {
    // Load webhook URL from settings for this tenant
    await tenantStorage.run({ tenantId }, async () => {
      const setting = await db.prisma.setting.findUnique({
        where: { key_tenantId: { key: 'webhook', tenantId } }
      });

      if (!setting || !setting.value?.url) return;

      const webhookUrl = setting.value.url;
      const secret = setting.value.secret || '';
      const body = JSON.stringify({ event, tenantId, timestamp: Date.now(), data: payload });
      const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');

      // Use native fetch (Node 18+)
      fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BakeFlow-Signature': `sha256=${sig}`,
          'X-BakeFlow-Event': event
        },
        body,
        signal: AbortSignal.timeout(5000)
      }).catch(err => console.warn(`Webhook delivery failed [${event}]:`, err.message));
    });
  } catch (err) {
    console.warn('Webhook fire error:', err.message);
  }
}

module.exports = router;
module.exports.fireWebhook = fireWebhook;
