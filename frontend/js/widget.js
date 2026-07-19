(function() {
  // Find the script tag to read parameters
  const scripts = document.getElementsByTagName('script');
  let apiKey = '';
  let containerId = 'bakeflow-widget';

  for (let i = 0; i < scripts.length; i++) {
    const src = scripts[i].src;
    if (src && src.includes('widget.js')) {
      const urlParams = new URLSearchParams(src.split('?')[1]);
      apiKey = urlParams.get('key') || '';
      containerId = urlParams.get('container') || 'bakeflow-widget';
      break;
    }
  }

  if (!apiKey) {
    console.error('BakeFlow Widget Error: Missing API key. Include ?key=YOUR_KEY in script src.');
    return;
  }

  // Load widget once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  async function initWidget() {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`BakeFlow Widget Warning: Container #${containerId} not found in DOM.`);
      return;
    }

    // Inject styles dynamically
    const style = document.createElement('style');
    style.innerHTML = `
      .bf-widget {
        font-family: 'DM Sans', -apple-system, sans-serif;
        color: #f3f4f6;
        background: #1a1a1e;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        padding: 24px;
        max-width: 800px;
        margin: 20px auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      }
      .bf-header {
        font-family: 'Cormorant Garamond', serif;
        font-size: 28px;
        font-weight: 600;
        color: #d4af37;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .bf-products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
      }
      .bf-product-card {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 16px;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .bf-product-card:hover {
        background: rgba(255,255,255,0.06);
        transform: translateY(-2px);
      }
      .bf-prod-emoji {
        font-size: 32px;
        margin-bottom: 12px;
      }
      .bf-prod-name {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 4px;
      }
      .bf-prod-cat {
        font-size: 12px;
        color: #9ca3af;
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .bf-prod-price-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 10px;
      }
      .bf-prod-price {
        font-weight: 700;
        color: #d4af37;
        font-size: 18px;
      }
      .bf-order-btn {
        background: #d4af37;
        color: #000;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s;
      }
      .bf-order-btn:hover {
        opacity: 0.9;
      }
      .bf-loading {
        text-align: center;
        color: #9ca3af;
        padding: 20px;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);

    container.innerHTML = `<div class="bf-widget"><div class="bf-loading">Loading menu items from BakeFlow...</div></div>`;

    try {
      const host = window.location.origin;
      const res = await fetch(`${host}/v1/products`, {
        headers: { 'X-API-Key': apiKey }
      });

      if (!res.ok) throw new Error('Failed to fetch catalog');
      const products = await res.json();

      if (products.length === 0) {
        container.innerHTML = `
          <div class="bf-widget">
            <div class="bf-header">Menu Catalog</div>
            <div style="text-align:center;color:#9ca3af;">No products are currently published in the catalog.</div>
          </div>
        `;
        return;
      }

      const gridHtml = products.map(p => `
        <div class="bf-product-card">
          <div>
            <div class="bf-prod-emoji">${p.emoji || '🎂'}</div>
            <div class="bf-prod-name">${p.name}</div>
            <div class="bf-prod-cat">${p.cat}</div>
          </div>
          <div class="bf-prod-price-row">
            <span class="bf-prod-price">₹${p.sell}</span>
            <button class="bf-order-btn" onclick="alert('Order placement via website can be completed using our checkout integration!')">Order</button>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="bf-widget">
          <div class="bf-header">
            <span>Menu Catalog</span>
            <span style="font-size:12px;color:#9ca3af;font-family:'DM Sans',sans-serif;">Powered by BakeFlow</span>
          </div>
          <div class="bf-products-grid">
            ${gridHtml}
          </div>
        </div>
      `;

    } catch (err) {
      container.innerHTML = `
        <div class="bf-widget">
          <div class="bf-header">Menu Catalog</div>
          <div style="text-align:center;color:#ef4444;">Failed to load catalog: ${err.message}</div>
        </div>
      `;
    }
  }
})();
