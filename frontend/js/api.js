// ============================================================
// BlissOven API Client — replaces the localStorage BlissDB
// All functions return Promises resolving to parsed JSON
// ============================================================

// Configure your production backend Render URL here:
// Example: 'https://blissoven-backend.onrender.com/api'
const PROD_BACKEND_API_URL = 'https://blissoven-calculator.onrender.com/api'; 

const API = {
  _base: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? '/api'
    : (PROD_BACKEND_API_URL || '/api'),

  async _req(path, opts = {}) {
    const res = await fetch(this._base + path, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}`);
    }
    return res.json();
  },

  // ── Ingredients ─────────────────────────────────────────────
  getIngredients() { return this._req('/ingredients'); },

  addIngredient(item) {
    return this._req('/ingredients', { method: 'POST', body: JSON.stringify(item) });
  },

  updateIngredientRate(id, rate, rateHistory) {
    return this._req(`/ingredients/${id}/rate`, {
      method: 'PUT', body: JSON.stringify({ rate, rateHistory }),
    });
  },

  softDeleteIngredient(id) {
    return this._req(`/ingredients/${id}`, { method: 'DELETE' });
  },

  restoreIngredient(id) {
    return this._req(`/ingredients/${id}/restore`, { method: 'POST' });
  },

  hardDeleteIngredient(id) {
    return this._req(`/ingredients/${id}/hard`, { method: 'DELETE' });
  },

  // ── Packaging ────────────────────────────────────────────────
  getPackaging() { return this._req('/packaging'); },

  addPackaging(item) {
    return this._req('/packaging', { method: 'POST', body: JSON.stringify(item) });
  },

  updatePackagingRate(id, rate, rateHistory) {
    return this._req(`/packaging/${id}/rate`, {
      method: 'PUT', body: JSON.stringify({ rate, rateHistory }),
    });
  },

  softDeletePackaging(id) {
    return this._req(`/packaging/${id}`, { method: 'DELETE' });
  },

  restorePackaging(id) {
    return this._req(`/packaging/${id}/restore`, { method: 'POST' });
  },

  hardDeletePackaging(id) {
    return this._req(`/packaging/${id}/hard`, { method: 'DELETE' });
  },

  // ── Products ─────────────────────────────────────────────────
  getProducts() { return this._req('/products'); },

  addProduct(item) {
    return this._req('/products', { method: 'POST', body: JSON.stringify(item) });
  },

  softDeleteProduct(id) {
    return this._req(`/products/${id}`, { method: 'DELETE' });
  },

  restoreProduct(id) {
    return this._req(`/products/${id}/restore`, { method: 'POST' });
  },

  hardDeleteProduct(id) {
    return this._req(`/products/${id}/hard`, { method: 'DELETE' });
  },

  // ── Orders ───────────────────────────────────────────────────
  getOrders() { return this._req('/orders'); },

  saveOrder(order) {
    return this._req('/orders', { method: 'POST', body: JSON.stringify(order) });
  },

  softDeleteOrder(id) {
    return this._req(`/orders/${id}`, { method: 'DELETE' });
  },

  restoreOrder(id) {
    return this._req(`/orders/${id}/restore`, { method: 'POST' });
  },

  hardDeleteOrder(id) {
    return this._req(`/orders/${id}/hard`, { method: 'DELETE' });
  },

  // ── Settings ─────────────────────────────────────────────────
  getSettings() { return this._req('/settings'); },

  saveSettings(key, value) {
    return this._req('/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
  },

  // ── Audit ────────────────────────────────────────────────────
  log(action, details) {
    return this._req('/audit', { method: 'POST', body: JSON.stringify({ action, details }) });
  },
};
