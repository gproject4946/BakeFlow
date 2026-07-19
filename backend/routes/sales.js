const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');
const enforceQuota = require('../middleware/quotaEnforcer');

function strip(row) { const { _rowIndex, ...rest } = row; return rest; }
function emp(req) { return { name: req.headers['x-employee-name']||'Unknown', email: req.headers['x-employee-email']||'' }; }

async function nextInvoiceNumber() {
  return db.nextInvoiceNumber();
}

// GET all invoices
router.get('/', async (req, res) => {
  try {
    const items = await db.getAll('SalesInvoices');
    res.json(items.filter(i => !i.deleted).reverse().map(strip));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST - create invoice
router.post('/', async (req, res) => {
  try {
    const e = emp(req);
    const invoiceNumber = await nextInvoiceNumber();
    const item = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      customerId: req.body.customerId||'',
      customerName: req.body.customerName||'',
      customerPhone: req.body.customerPhone||'',
      customerCity: req.body.customerCity||'',
      items: req.body.items||[],
      subtotal: Number(req.body.subtotal)||0,
      discountAmt: Number(req.body.discountAmt)||0,
      gstPct: Number(req.body.gstPct)||0,
      gstAmt: Number(req.body.gstAmt)||0,
      totalAmount: Number(req.body.totalAmount)||0,
      paymentMethod: req.body.paymentMethod||'Cash',
      notes: req.body.notes||'',
      date: new Date().toLocaleDateString('en-IN'),
      timestamp: Date.now(),
      createdBy: e.name,
      createdByEmail: e.email,
      inventoryDeducted: false,
      inventoryDeductedAt: '',
      whatsappSent: false,
      whatsappSentAt: '',
      whatsappSentBy: '',
      deleted: false,
      deletedAt: '',
    };
    await db.append('SalesInvoices', item);
    // Update customer stats
    if (item.customerId) {
      try {
        const customers = await db.getAll('Customers');
        const cust = customers.find(c => c.id === item.customerId);
        if (cust) {
          cust.totalOrders = (Number(cust.totalOrders)||0) + 1;
          cust.totalValue = (Number(cust.totalValue)||0) + item.totalAmount;
          cust.lastOrderDate = item.date;
          await db.updateRow('Customers', cust._rowIndex, cust);
        }
      } catch(custErr) { console.error('Customer stat update failed:', custErr.message); }
    }
    await db.addLog('CREATE_SALE', `${invoiceNumber} | ${item.customerName} | ₹${item.totalAmount}`, e.name, e.email, 'SalesInvoice', item.id);
    res.json(item);
  } catch (err) {
    console.error('[sales] POST:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE - soft delete
router.delete('/:id', async (req, res) => {
  try {
    const rows = await db.getAll('SalesInvoices');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const e = emp(req);
    row.deleted = true; row.deletedAt = Date.now();
    await db.updateRow('SalesInvoices', row._rowIndex, row);

    // Rollback customer stats
    if (row.customerId) {
      try {
        const customers = await db.getAll('Customers');
        const cust = customers.find(c => c.id === row.customerId);
        if (cust) {
          cust.totalOrders = Math.max(0, (Number(cust.totalOrders) || 0) - 1);
          cust.totalValue = Math.max(0, (Number(cust.totalValue) || 0) - Number(row.totalAmount));

          // Re-calculate lastOrderDate from remaining active invoices
          const activeInvoices = rows.filter(i => i.customerId === row.customerId && !i.deleted && i.id !== row.id);
          if (activeInvoices.length > 0) {
            activeInvoices.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
            cust.lastOrderDate = activeInvoices[0].date || '';
          } else {
            cust.lastOrderDate = '';
          }

          await db.updateRow('Customers', cust._rowIndex, cust);
        }
      } catch(custErr) { console.error('Customer stats rollback failed:', custErr.message); }
    }

    await db.addLog('DELETE_SALE', row.invoiceNumber, e.name, e.email, 'SalesInvoice', row.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST - send WhatsApp invoice via Twilio
router.post('/:id/send-whatsapp', enforceQuota, async (req, res) => {
  try {
    const rows = await db.getAll('SalesInvoices');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const e = emp(req);
    const businessName = process.env.BUSINESS_NAME || 'BakeFlow';
    const businessPhone = process.env.BUSINESS_PHONE || '';

    // Build WhatsApp message
    const items = Array.isArray(row.items) ? row.items : [];
    const itemLines = items.map(i => `• ${i.name} × ${i.qty} — ₹${(Number(i.qty)*Number(i.unitPrice)).toFixed(2)}`).join('\n');
    const lines = [
      `🎂 *${businessName}*`,
      ``,
      `Hello ${row.customerName.split(' ')[0]}! 👋`,
      ``,
      `Thank you for your order. Here's your invoice:`,
      ``,
      `🧾 *${row.invoiceNumber}*`,
      `📅 ${row.date}`,
      ``,
      `📦 *Items:*`,
      itemLines,
      ``,
      `💰 Subtotal: ₹${Number(row.subtotal).toFixed(2)}`,
      Number(row.gstAmt) > 0 ? `🏷 GST (${row.gstPct}%): ₹${Number(row.gstAmt).toFixed(2)}` : null,
      Number(row.discountAmt) > 0 ? `🎁 Discount: − ₹${Number(row.discountAmt).toFixed(2)}` : null,
      `──────────────────`,
      `✅ *Total: ₹${Number(row.totalAmount).toFixed(2)}*`,
      `💳 ${row.paymentMethod}`,
      row.notes ? `\n📝 ${row.notes}` : null,
      ``,
      `We hope you love it! 🙏`,
      `See you again soon ✨`,
      ``,
      `— ${businessName}`,
      businessPhone ? `📞 ${businessPhone}` : null,
      ``,
      `_Invoice by: ${e.name}_`,
    ].filter(l => l !== null).join('\n');

    // Format the phone number dynamically to ensure Twilio can route it
    let targetPhone = (row.customerPhone || '').toString().trim().replace(/[^0-9+]/g, '');
    if (!targetPhone.startsWith('+')) {
      if (targetPhone.length === 10) {
        targetPhone = '+91' + targetPhone; // Default to India country code
      } else {
        targetPhone = '+' + targetPhone;
      }
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${targetPhone}`,
      body: lines,
    });

    row.whatsappSent = true;
    row.whatsappSentAt = new Date().toLocaleString('en-IN');
    row.whatsappSentBy = e.name;
    await db.updateRow('SalesInvoices', row._rowIndex, row);
    await db.addLog('SEND_WHATSAPP', `${row.invoiceNumber} → ${row.customerPhone}`, e.name, e.email, 'SalesInvoice', row.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[sales] WhatsApp:', err.message);
    res.status(500).json({ error: err.message, details: err.toString() });
  }
});

// POST - mark inventory as deducted
router.post('/:id/deduct-inventory', async (req, res) => {
  try {
    const rows = await db.getAll('SalesInvoices');
    const row = rows.find(r => r.id === req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const e = emp(req);
    // Mark as deducted (actual ingredient deduction is manual; this flags the invoice)
    row.inventoryDeducted = true;
    row.inventoryDeductedAt = new Date().toLocaleString('en-IN');
    await db.updateRow('SalesInvoices', row._rowIndex, row);
    await db.addLog('DEDUCT_INVENTORY', `${row.invoiceNumber}`, e.name, e.email, 'SalesInvoice', row.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
