const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../sheets/sheetsClient');
const requireRole = require('../middleware/requireRole');

// All /api/team routes require admin or owner role
router.use(requireRole(['admin', 'owner']));

// GET /api/team
// List all users (employees + owner) for this bakery
router.get('/', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const users = await db.prisma.user.findMany({
      where: { tenantId, deleted: false },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        authMethod: true,
        active: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team
// Create a new employee account for this bakery
router.post('/', async (req, res) => {
  const { name, username, password, role } = req.body;
  const tenantId = req.user.tenantId;

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Name, username, and password are required' });
  }

  try {
    // Check for duplicate username within this tenant
    const existing = await db.prisma.user.findUnique({
      where: { username_tenantId: { username, tenantId } }
    });
    if (existing) {
      return res.status(409).json({ error: `Username "${username}" is already taken in your bakery.` });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await db.prisma.user.create({
      data: {
        tenantId,
        name,
        username,
        password: hashedPassword,
        role: role || 'employee',
        authMethod: 'password',
        active: true
      }
    });

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/team/:id
// Update employee — name, role, active toggle, or reset password
router.put('/:id', async (req, res) => {
  const { name, role, active, password } = req.body;
  const tenantId = req.user.tenantId;

  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (active !== undefined) updateData.active = active;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await db.prisma.user.update({
      where: { id: req.params.id, tenantId },
      data: updateData
    });

    res.json({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      active: user.active
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/team/:id
// Soft-delete employee (preserves data, blocks login)
router.delete('/:id', async (req, res) => {
  const tenantId = req.user.tenantId;
  try {
    await db.prisma.user.update({
      where: { id: req.params.id, tenantId },
      data: { active: false, deleted: true, deletedAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/sessions
// All login sessions for the tenant (last 90 days), newest first
router.get('/sessions', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
    const sessions = await db.prisma.userSession.findMany({
      where: { tenantId, loginAt: { gte: since } },
      include: { user: { select: { id: true, name: true, username: true, role: true } } },
      orderBy: { loginAt: 'desc' },
      take: 200
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/team/sessions/:userId
// Sessions for a specific employee
router.get('/sessions/:userId', async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const sessions = await db.prisma.userSession.findMany({
      where: { tenantId, userId: req.params.userId },
      orderBy: { loginAt: 'desc' },
      take: 100
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/team/logout
// Record logout time for the current session
router.post('/logout', async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
    await db.prisma.userSession.update({
      where: { id: sessionId, tenantId: req.user.tenantId },
      data: { logoutAt: new Date() }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
