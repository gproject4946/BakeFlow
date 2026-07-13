// ============================================================
// BakeFlow ERP — API Client
// All functions return Promises resolving to parsed JSON
// Employee name/email sent as headers on every request
// ============================================================

const PROD_BACKEND_API_URL = ''; // Left empty to automatically use the same origin (relative path)

const API = {
  _base: '/api',

  async _req(path, opts = {}) {
    // Always attach employee identity headers for audit log
    const sess = JSON.parse(localStorage.getItem('bakeflow_session') || '{}');
    const headers = { 'Content-Type': 'application/json' };
    if (sess.name)  headers['X-Employee-Name']  = sess.name;
    if (sess.email) headers['X-Employee-Email'] = sess.email;

    const res = await fetch(this._base + path, {
      headers,
      ...opts,
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // ── Auth ──────────────────────────────────────────────────────
  verifyRole(role, employeeIndex, password) {
    return this._req('/auth/verify-role', {
      method: 'POST',
      body: JSON.stringify({ role, employeeIndex, password }),
    });
  },
  getEmployees() { return this._req('/auth/employees'); },
  getConfig()    { return this._req('/auth/config'); },

  // ── Ingredients ───────────────────────────────────────────────
  getIngredients() { return this._req('/ingredients'); },

  addIngredient(item) {
    return this._req('/ingredients', { method: 'POST', body: JSON.stringify(item) });
  },

  updateIngredientRate(id, rate, rateHistory) {
    return this._req(`/ingredients/${id}/rate`, {
      method: 'PUT', body: JSON.stringify({ rate, rateHistory }),
    });
  },

  updateIngredientStock(id, stockQty, minAlert) {
    return this._req(`/ingredients/${id}/stock`, {
      method: 'PUT', body: JSON.stringify({ stockQty, minAlert }),
    });
  },

  softDeleteIngredient(id) { return this._req(`/ingredients/${id}`, { method: 'DELETE' }); },
  restoreIngredient(id)    { return this._req(`/ingredients/${id}/restore`, { method: 'POST' }); },
  hardDeleteIngredient(id) { return this._req(`/ingredients/${id}/hard`, { method: 'DELETE' }); },

  // ── Packaging ─────────────────────────────────────────────────
  getPackaging() { return this._req('/packaging'); },

  addPackaging(item) {
    return this._req('/packaging', { method: 'POST', body: JSON.stringify(item) });
  },

  updatePackagingRate(id, rate, rateHistory) {
    return this._req(`/packaging/${id}/rate`, {
      method: 'PUT', body: JSON.stringify({ rate, rateHistory }),
    });
  },

  updatePackagingStock(id, stockQty, minAlert) {
    return this._req(`/packaging/${id}/stock`, {
      method: 'PUT', body: JSON.stringify({ stockQty, minAlert }),
    });
  },

  softDeletePackaging(id) { return this._req(`/packaging/${id}`, { method: 'DELETE' }); },
  restorePackaging(id)    { return this._req(`/packaging/${id}/restore`, { method: 'POST' }); },
  hardDeletePackaging(id) { return this._req(`/packaging/${id}/hard`, { method: 'DELETE' }); },

  // ── Products ──────────────────────────────────────────────────
  getProducts() { return this._req('/products'); },

  addProduct(item) {
    return this._req('/products', { method: 'POST', body: JSON.stringify(item) });
  },

  softDeleteProduct(id) { return this._req(`/products/${id}`, { method: 'DELETE' }); },
  restoreProduct(id)    { return this._req(`/products/${id}/restore`, { method: 'POST' }); },
  hardDeleteProduct(id) { return this._req(`/products/${id}/hard`, { method: 'DELETE' }); },

  // ── Orders ────────────────────────────────────────────────────
  getOrders() { return this._req('/orders'); },

  saveOrder(order) {
    return this._req('/orders', { method: 'POST', body: JSON.stringify(order) });
  },

  softDeleteOrder(id) { return this._req(`/orders/${id}`, { method: 'DELETE' }); },
  restoreOrder(id)    { return this._req(`/orders/${id}/restore`, { method: 'POST' }); },
  hardDeleteOrder(id) { return this._req(`/orders/${id}/hard`, { method: 'DELETE' }); },

  // ── Settings ──────────────────────────────────────────────────
  getSettings() { return this._req('/settings'); },

  saveSettings(key, value) {
    return this._req('/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
  },

  // ── Audit ─────────────────────────────────────────────────────
  log(action, details, entityType, entityId) {
    return this._req('/audit', {
      method: 'POST',
      body: JSON.stringify({ action, details, entityType: entityType || '', entityId: entityId || '' }),
    });
  },
  getAuditLog() { return this._req('/audit'); },

  // ── Customers ─────────────────────────────────────────────────
  getCustomers() { return this._req('/customers'); },

  addCustomer(data) {
    return this._req('/customers', { method: 'POST', body: JSON.stringify(data) });
  },

  updateCustomer(id, data) {
    return this._req(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteCustomer(id) { return this._req(`/customers/${id}`, { method: 'DELETE' }); },

  // ── Sales Invoices ────────────────────────────────────────────
  getSales() { return this._req('/sales'); },

  createSale(data) {
    return this._req('/sales', { method: 'POST', body: JSON.stringify(data) });
  },

  deleteSale(id) { return this._req(`/sales/${id}`, { method: 'DELETE' }); },

  sendSaleWhatsApp(id) {
    return this._req(`/sales/${id}/send-whatsapp`, { method: 'POST' });
  },

  deductInventory(id) {
    return this._req(`/sales/${id}/deduct-inventory`, { method: 'POST' });
  },

  // ── AI Invoice Scanner (Gemini) ───────────────────────────────
  scanInvoice(base64Image) {
    return this._req('/invoice/scan', {
      method: 'POST',
      body: JSON.stringify({ image: base64Image }),
    });
  },
};
