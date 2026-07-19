const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');
const bcrypt = require('bcryptjs');

// Middleware to require role: 'platform_admin'
const requirePlatformAdmin = async (req, res, next) => {
  if (req.user?.role !== 'platform_admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: Platform administrator access required' });
  }
  next();
};

router.use(requirePlatformAdmin);

// GET /api/admin/tenants
// List all tenants with stats
router.get('/tenants', async (req, res) => {
  try {
    const tenants = await db.prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            salesInvoices: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(tenants.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      googleId: t.googleId,
      status: t.status,
      plan: t.plan,
      createdAt: t.createdAt,
      userCount: t._count.users,
      productCount: t._count.products,
      salesCount: t._count.salesInvoices
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/tenants
// Onboard a new bakery
router.post('/tenants', async (req, res) => {
  const { name, email, googleId, plan, phone, password } = req.body;
  if (!name || !email || !googleId) {
    return res.status(400).json({ error: 'Bakery name, owner email, and Google ID are required' });
  }

  try {
    const targetPlan = plan || 'free';
    if (targetPlan === 'free') {
      const freeCount = await db.prisma.tenant.count({
        where: { plan: 'free' }
      });
      if (freeCount >= 5) {
        return res.status(400).json({ error: 'Limit reached: A maximum of 5 bakeries can run on the Free Beta plan concurrently.' });
      }
    }

    const tenant = await db.prisma.tenant.create({
      data: {
        name,
        email,
        googleId,
        phone: phone || null,
        plan: targetPlan,
        status: 'active'
      }
    });

    // Hash the password if provided, otherwise leave empty (owner can reset/verify via WhatsApp later)
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Automatically create the owner user account for this tenant
    await db.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: name + ' Owner',
        email: email,
        phone: phone || null,
        googleId: googleId,
        role: 'owner',
        authMethod: 'google',
        password: hashedPassword,
        active: true
      }
    });

    // Seed default setting rows (labour, overhead) for this new tenant
    await db.prisma.setting.create({
      data: {
        key: 'labour',
        tenantId: tenant.id,
        value: {
          rates: { head: 200, deco: 180, pack: 100, delivery: 150, min: 100 },
          times: { prep: 30, bake: 45, decoSimple: 30, decoComplex: 120, pack: 15 }
        }
      }
    });

    await db.prisma.setting.create({
      data: {
        key: 'overhead',
        tenantId: tenant.id,
        value: {
          fixed: { rent: 15000, elec: 3000, gas: 1500, internet: 500, clean: 1000, days: 25, orders: 3 },
          toggles: { elec: true, gas: true, water: true, rent: true, clean: true, depr: false, admin: false, gst: false }
        }
      }
    });

    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/tenants/:id/suspend
// Suspend a bakery
router.put('/tenants/:id/suspend', async (req, res) => {
  try {
    const tenant = await db.prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'suspended' }
    });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/tenants/:id/reactivate
// Reactivate a suspended bakery
router.put('/tenants/:id/reactivate', async (req, res) => {
  try {
    const tenant = await db.prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'active' }
    });
    res.json(tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/metrics
// Return overall platform metrics
router.get('/metrics', async (req, res) => {
  try {
    const tenantCount = await db.prisma.tenant.count();
    const productCount = await db.prisma.product.count();
    const salesCount = await db.prisma.salesInvoice.count();
    const activeTenants = await db.prisma.tenant.count({ where: { status: 'active' } });

    res.json({
      tenantCount,
      activeTenants,
      productCount,
      salesCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/tenants/:id/approve
// Approve a pending onboarding request
router.put('/tenants/:id/approve', async (req, res) => {
  try {
    const tenant = await db.prisma.tenant.findUnique({
      where: { id: req.params.id }
    });
    if (!tenant) return res.status(404).json({ error: 'Tenant onboarding request not found' });

    // Enforce max 5 free tier bakeries
    if (tenant.plan === 'free') {
      const freeCount = await db.prisma.tenant.count({
        where: { plan: 'free', status: 'active' }
      });
      if (freeCount >= 5) {
        return res.status(400).json({ error: 'Limit reached: A maximum of 5 bakeries can run on the Free Beta plan concurrently.' });
      }
    }

    // Activate the tenant
    await db.prisma.tenant.update({
      where: { id: req.params.id },
      data: { status: 'active' }
    });

    // Create the Owner account (copies phone and password from the request record)
    await db.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: tenant.name + ' Owner',
        email: tenant.email,
        phone: tenant.phone,
        googleId: tenant.googleId,
        role: 'owner',
        authMethod: 'google',
        password: tenant.password,
        active: true
      }
    });

    // Clear password on tenant record for safety
    await db.prisma.tenant.update({
      where: { id: tenant.id },
      data: { password: null }
    });

    // Seed defaults
    await db.prisma.setting.create({
      data: {
        key: 'labour',
        tenantId: tenant.id,
        value: {
          rates: { head: 200, deco: 180, pack: 100, delivery: 150, min: 100 },
          times: { prep: 30, bake: 45, decoSimple: 30, decoComplex: 120, pack: 15 }
        }
      }
    });

    await db.prisma.setting.create({
      data: {
        key: 'overhead',
        tenantId: tenant.id,
        value: {
          fixed: { rent: 15000, elec: 3000, gas: 1500, internet: 500, clean: 1000, days: 25, orders: 3 },
          toggles: { elec: true, gas: true, water: true, rent: true, clean: true, depr: false, admin: false, gst: false }
        }
      }
    });

    res.json({ success: true, message: 'Onboarding request approved!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
// Platform-wide usage stats for cost calculation
router.get('/stats', async (req, res) => {
  try {
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ── Platform totals ──────────────────────────────────────
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalSessions,
      totalInvoices,
      totalOrders,
      totalProducts,
      totalCustomers
    ] = await Promise.all([
      db.prisma.tenant.count(),
      db.prisma.tenant.count({ where: { status: 'active' } }),
      db.prisma.user.count({ where: { deleted: false } }),
      db.prisma.userSession.count(),
      db.prisma.salesInvoice.count({ where: { deleted: false } }),
      db.prisma.order.count({ where: { deleted: false } }),
      db.prisma.product.count({ where: { deleted: false } }),
      db.prisma.customer.count({ where: { deleted: false } })
    ]);

    // ── API usage (all time) ──────────────────────────────────
    const [totalScans, totalWhatsapp, thisMonthScans, thisMonthWhatsapp, lastMonthScans, lastMonthWhatsapp] =
      await Promise.all([
        db.prisma.auditLog.count({ where: { action: 'SCAN_INVOICE' } }),
        db.prisma.auditLog.count({ where: { action: 'SEND_WHATSAPP' } }),
        db.prisma.auditLog.count({ where: { action: 'SCAN_INVOICE',   date: { gte: monthStart.toISOString().slice(0,10) } } }),
        db.prisma.auditLog.count({ where: { action: 'SEND_WHATSAPP',  date: { gte: monthStart.toISOString().slice(0,10) } } }),
        db.prisma.auditLog.count({ where: { action: 'SCAN_INVOICE',   date: { gte: lastMonth.toISOString().slice(0,10), lte: lastMonthEnd.toISOString().slice(0,10) } } }),
        db.prisma.auditLog.count({ where: { action: 'SEND_WHATSAPP',  date: { gte: lastMonth.toISOString().slice(0,10), lte: lastMonthEnd.toISOString().slice(0,10) } } })
      ]);

    // ── Per-bakery breakdown ──────────────────────────────────
    const tenants = await db.prisma.tenant.findMany({
      where: { status: { not: 'pending' } },
      orderBy: { createdAt: 'desc' }
    });

    const perBakery = await Promise.all(tenants.map(async (t) => {
      const [scansTotal, whatsappTotal, scansMo, whatsappMo, invoices, orders, users, sessions] =
        await Promise.all([
          db.prisma.auditLog.count({ where: { tenantId: t.id, action: 'SCAN_INVOICE' } }),
          db.prisma.auditLog.count({ where: { tenantId: t.id, action: 'SEND_WHATSAPP' } }),
          db.prisma.auditLog.count({ where: { tenantId: t.id, action: 'SCAN_INVOICE',  date: { gte: monthStart.toISOString().slice(0,10) } } }),
          db.prisma.auditLog.count({ where: { tenantId: t.id, action: 'SEND_WHATSAPP', date: { gte: monthStart.toISOString().slice(0,10) } } }),
          db.prisma.salesInvoice.count({ where: { tenantId: t.id, deleted: false } }),
          db.prisma.order.count({ where: { tenantId: t.id, deleted: false } }),
          db.prisma.user.count({ where: { tenantId: t.id, deleted: false } }),
          db.prisma.userSession.count({ where: { tenantId: t.id } })
        ]);

      // Cost estimates (approximate API costs)
      // Gemini Flash: ~$0.00025 per scan | Twilio WhatsApp: ~$0.005 per message
      const estimatedCost = (scansTotal * 0.00025) + (whatsappTotal * 0.005);
      const monthlyCost   = (scansMo    * 0.00025) + (whatsappMo    * 0.005);

      return {
        id: t.id, name: t.name, email: t.email,
        plan: t.plan, status: t.status, createdAt: t.createdAt,
        scansTotal, whatsappTotal, scansMo, whatsappMo,
        invoices, orders, users, sessions,
        estimatedCost: +estimatedCost.toFixed(4),
        monthlyCost:   +monthlyCost.toFixed(4)
      };
    }));

    // ── Platform cost totals ──────────────────────────────────
    const totalEstimatedCost = +((totalScans * 0.00025) + (totalWhatsapp * 0.005)).toFixed(4);
    const monthlyEstimatedCost = +((thisMonthScans * 0.00025) + (thisMonthWhatsapp * 0.005)).toFixed(4);

    res.json({
      platform: {
        totalTenants, activeTenants,
        totalUsers, totalSessions,
        totalInvoices, totalOrders,
        totalProducts, totalCustomers
      },
      usage: {
        allTime:   { scans: totalScans,      whatsapp: totalWhatsapp,      cost: totalEstimatedCost },
        thisMonth: { scans: thisMonthScans,  whatsapp: thisMonthWhatsapp,  cost: monthlyEstimatedCost },
        lastMonth: { scans: lastMonthScans,  whatsapp: lastMonthWhatsapp }
      },
      perBakery
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
