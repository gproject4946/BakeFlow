const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../sheets/sheetsClient');
const requireRole = require('../middleware/requireRole');

// All /api/api-keys routes require admin or owner role
router.use(requireRole(['admin', 'owner']));

// GET /api/api-keys
// List all API keys for this tenant (masked, never raw)
router.get('/', async (req, res) => {
  try {
    const keys = await db.prisma.apiKey.findMany({
      where: { tenantId: req.user.tenantId },
      select: { id: true, name: true, keyHash: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(keys.map(k => ({
      id: k.id,
      name: k.name,
      maskedKey: 'bfk_••••••••' + k.keyHash.slice(-4),
      createdAt: k.createdAt
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/api-keys
// Generate a new API key for this tenant
// Returns the plaintext key ONCE — it is never stored in plaintext
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'API key name is required' });

  try {
    // Generate a cryptographically secure random key
    const rawKey = 'bfk_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await db.prisma.apiKey.create({
      data: {
        tenantId: req.user.tenantId,
        name,
        keyHash
      }
    });

    // Return plaintext key ONCE — cannot be retrieved again
    res.json({
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey,           // Only shown this one time
      createdAt: apiKey.createdAt,
      warning: 'Copy this key now — it will never be shown again.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/api-keys/:id
// Revoke an API key immediately
router.delete('/:id', async (req, res) => {
  try {
    await db.prisma.apiKey.delete({
      where: { id: req.params.id, tenantId: req.user.tenantId }
    });
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'API key not found' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
