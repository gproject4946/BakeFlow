const express = require('express');
const router = express.Router();
const db = require('../sheets/sheetsClient');

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
  const { name, email, googleId, plan } = req.body;
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
        plan: targetPlan,
        status: 'active'
      }
    });

    // Automatically create the owner user account for this tenant
    await db.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: name + ' Owner',
        email: email,
        googleId: googleId,
        role: 'owner',
        authMethod: 'google',
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

    // Create the Owner account
    await db.prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: tenant.name + ' Owner',
        email: tenant.email,
        googleId: tenant.googleId,
        role: 'owner',
        authMethod: 'google',
        active: true
      }
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

module.exports = router;
