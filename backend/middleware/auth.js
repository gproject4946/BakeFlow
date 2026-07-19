const jwt = require('jsonwebtoken');
const db = require('../sheets/sheetsClient');

module.exports = async (req, res, next) => {
  // Allow bypassing auth on paths like healthcheck or public config if needed,
  // but let's enforce it on API endpoints in server.js or explicitly per route.
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, error: 'Token format must be Bearer <token>' });
  }

  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || 'super-secure-bakeflow-default-secret-key-999';
    const decoded = jwt.verify(token, secret);

    // If the user belongs to a bakery tenant (not platform admin), verify tenant is active and trial hasn't expired
    if (decoded.role !== 'platform_admin' && decoded.tenantId) {
      const tenant = await db.prisma.tenant.findUnique({
        where: { id: decoded.tenantId }
      });
      if (!tenant || tenant.status === 'suspended') {
        return res.status(403).json({ success: false, error: 'Access Denied: Your bakery account is suspended. Please contact platform support.' });
      }

      // Enforce 2-month trial limit on Free Beta plan
      if (tenant.plan === 'free') {
        const twoMonthsMs = 60 * 24 * 60 * 60 * 1000;
        const elapsed = Date.now() - new Date(tenant.createdAt).getTime();
        if (elapsed > twoMonthsMs) {
          return res.status(403).json({ success: false, error: 'Access Denied: Your 2-month Free Beta period has ended. Please contact support to upgrade.' });
        }
      }
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
