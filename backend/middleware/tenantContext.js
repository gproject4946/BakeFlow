const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();

function tenantMiddleware(req, res, next) {
  // Extract tenantId from the verified JWT session user
  // Fall back to default-tenant-uuid if not present (for compatibility/development)
  const tenantId = req.user?.tenantId || 'default-tenant-uuid';

  const role = req.user?.role || null;

  tenantStorage.run({ tenantId, role }, () => {
    next();
  });
}

module.exports = {
  tenantStorage,
  tenantMiddleware
};
