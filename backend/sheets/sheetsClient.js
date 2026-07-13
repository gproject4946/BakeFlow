// ============================================================
// BlissOven Calculator — Google Sheets API Client
// Handles all read/write operations to Google Sheets
// ============================================================

const { google } = require('googleapis');

// ── Sheet Schema ─────────────────────────────────────────────
const SHEETS = {
  Ingredients: ['id','name','cat','unit','rate','updated','deleted','deletedAt','rateHistory'],
  Packaging:   ['id','name','type','size','rate','vendor','deleted','deletedAt','rateHistory'],
  Products:    ['id','name','cat','emoji','cost','sell','margin','deleted','deletedAt'],
  Orders:      ['id','name','category','date','timestamp','orderData','deleted','deletedAt'],
  Settings:    ['key','value'],
  AuditLog:    ['id','timestamp','date','action','details'],
};

// ── JSON fields that need serialization ──────────────────────
const JSON_FIELDS = new Set(['rateHistory', 'orderData', 'value']);

// ── Numeric fields ───────────────────────────────────────────
const NUMERIC_FIELDS = new Set(['rate', 'cost', 'sell', 'margin', 'timestamp', 'deletedAt']);

// ── Default seed data ─────────────────────────────────────────
const DEFAULT_INGREDIENTS = [
  {id:'ing-1', name:'All-Purpose Flour',    cat:'Dry',       unit:'kg',          rate:48,   updated:'15/01/2024'},
  {id:'ing-2', name:'Maida',               cat:'Dry',       unit:'kg',          rate:40,   updated:'15/01/2024'},
  {id:'ing-3', name:'Sugar (Fine)',         cat:'Dry',       unit:'kg',          rate:50,   updated:'10/01/2024'},
  {id:'ing-4', name:'Powdered Sugar',       cat:'Dry',       unit:'kg',          rate:60,   updated:'10/01/2024'},
  {id:'ing-5', name:'Cocoa Powder',         cat:'Dry',       unit:'kg',          rate:350,  updated:'12/01/2024'},
  {id:'ing-6', name:'Baking Powder',        cat:'Dry',       unit:'g',           rate:25,   updated:'05/01/2024'},
  {id:'ing-7', name:'Baking Soda',          cat:'Dry',       unit:'g',           rate:15,   updated:'05/01/2024'},
  {id:'ing-8', name:'Fresh Cream (25% fat)',cat:'Dairy',     unit:'litre',       rate:180,  updated:'18/01/2024'},
  {id:'ing-9', name:'Whipping Cream',       cat:'Dairy',     unit:'litre',       rate:280,  updated:'18/01/2024'},
  {id:'ing-10',name:'Butter (Amul)',        cat:'Dairy',     unit:'g',           rate:120,  updated:'16/01/2024'},
  {id:'ing-11',name:'Cream Cheese',         cat:'Dairy',     unit:'g',           rate:180,  updated:'14/01/2024'},
  {id:'ing-12',name:'Eggs',                cat:'Dairy',     unit:'piece',       rate:8,    updated:'18/01/2024'},
  {id:'ing-13',name:'Milk',                cat:'Dairy',     unit:'litre',       rate:60,   updated:'18/01/2024'},
  {id:'ing-14',name:'Belgian Dark Chocolate',cat:'Chocolate',unit:'kg',         rate:900,  updated:'10/01/2024'},
  {id:'ing-15',name:'Belgian Milk Chocolate',cat:'Chocolate',unit:'kg',         rate:800,  updated:'10/01/2024'},
  {id:'ing-16',name:'White Chocolate',      cat:'Chocolate', unit:'kg',          rate:850,  updated:'10/01/2024'},
  {id:'ing-17',name:'Alphonso Mango Pulp',  cat:'Fruit',     unit:'kg',          rate:250,  updated:'08/01/2024'},
  {id:'ing-18',name:'Strawberry (fresh)',   cat:'Fruit',     unit:'kg',          rate:200,  updated:'18/01/2024'},
  {id:'ing-19',name:'Kiwi',               cat:'Fruit',     unit:'piece',       rate:30,   updated:'18/01/2024'},
  {id:'ing-20',name:'Saffron (Kashmiri)',   cat:'Spice',     unit:'gram',        rate:12,   updated:'01/01/2024'},
  {id:'ing-21',name:'Cardamom Powder',      cat:'Spice',     unit:'50g',         rate:45,   updated:'05/01/2024'},
  {id:'ing-22',name:'Vanilla Extract',      cat:'Flavour',   unit:'30ml',        rate:80,   updated:'05/01/2024'},
  {id:'ing-23',name:'Lotus Biscoff',        cat:'Add-in',    unit:'250g pack',   rate:220,  updated:'12/01/2024'},
  {id:'ing-24',name:'Nutella',             cat:'Add-in',    unit:'350g',        rate:280,  updated:'12/01/2024'},
  {id:'ing-25',name:'Walnuts (California)', cat:'Nuts',      unit:'kg',          rate:900,  updated:'06/01/2024'},
  {id:'ing-26',name:'Pistachios (raw)',     cat:'Nuts',      unit:'kg',          rate:1200, updated:'06/01/2024'},
];

const DEFAULT_PACKAGING = [
  {id:'pack-1', name:'Cake Box 500g',       type:'Box',       size:'6×6 inch',   rate:35,  vendor:'LocalSupply'},
  {id:'pack-2', name:'Cake Box 1kg',        type:'Box',       size:'8×8 inch',   rate:45,  vendor:'LocalSupply'},
  {id:'pack-3', name:'Cake Box 2kg',        type:'Box',       size:'10×10 inch', rate:60,  vendor:'LocalSupply'},
  {id:'pack-4', name:'Brownie Box (8pc)',   type:'Box',       size:'Standard',   rate:25,  vendor:'LocalSupply'},
  {id:'pack-5', name:'Cookie Box (12pc)',   type:'Box',       size:'Standard',   rate:30,  vendor:'LocalSupply'},
  {id:'pack-6', name:'Chocolate Box (10pc)',type:'Box',       size:'Luxury',     rate:55,  vendor:'GiftPackaging'},
  {id:'pack-7', name:'Cake Board 6"',       type:'Board',     size:'6 inch',     rate:8,   vendor:'LocalSupply'},
  {id:'pack-8', name:'Cake Board 8"',       type:'Board',     size:'8 inch',     rate:12,  vendor:'LocalSupply'},
  {id:'pack-9', name:'Cake Board 10"',      type:'Board',     size:'10 inch',    rate:16,  vendor:'LocalSupply'},
  {id:'pack-10',name:'Carry Bag (small)',   type:'Bag',       size:'Small',      rate:15,  vendor:'PrintedBags'},
  {id:'pack-11',name:'Carry Bag (large)',   type:'Bag',       size:'Large',      rate:22,  vendor:'PrintedBags'},
  {id:'pack-12',name:'BlissOven Sticker',   type:'Sticker',   size:'Standard',   rate:3,   vendor:'PrintShop'},
  {id:'pack-13',name:'Message Card',        type:'Card',      size:'A6',         rate:5,   vendor:'PrintShop'},
  {id:'pack-14',name:'Thank-you Card',      type:'Card',      size:'Small',      rate:4,   vendor:'PrintShop'},
  {id:'pack-15',name:'Ribbon',             type:'Accessory', size:'1m',         rate:8,   vendor:'LocalSupply'},
  {id:'pack-16',name:'Tissue / Filler Paper',type:'Filler',  size:'Sheet',      rate:2,   vendor:'LocalSupply'},
];

const DEFAULT_PRODUCTS = [
  {id:'prod-1', name:'Rasmalai Cake',        cat:'Fusion Cake',    emoji:'🎂', cost:520, sell:950, margin:45},
  {id:'prod-2', name:'Gulab Jamun Cake',     cat:'Fusion Cake',    emoji:'🍮', cost:480, sell:850, margin:43},
  {id:'prod-3', name:'Fruit Cake (500g)',    cat:'Signature Cake', emoji:'🍓', cost:380, sell:650, margin:41},
  {id:'prod-4', name:'Classic Chocolate Cake',cat:'Celebration Cake',emoji:'🍫',cost:320,sell:550,margin:42},
  {id:'prod-5', name:'Fudgy Brownie Box (8pc)',cat:'Brownie Box',  emoji:'🟫', cost:280, sell:499, margin:44},
  {id:'prod-6', name:'Walnut Brownie Box',   cat:'Brownie Box',    emoji:'🌰', cost:300, sell:549, margin:45},
  {id:'prod-7', name:'Oreo Cheesecake',      cat:'Cheesecake',     emoji:'🍰', cost:420, sell:750, margin:44},
  {id:'prod-8', name:'Mango Cake',           cat:'Fusion Cake',    emoji:'🥭', cost:360, sell:650, margin:44},
  {id:'prod-9', name:'Kesar Pista Cake',     cat:'Fusion Cake',    emoji:'⭐', cost:500, sell:900, margin:44},
  {id:'prod-10',name:'Artisan Bread Loaf',   cat:'Homemade Bread', emoji:'🍞', cost:95,  sell:180, margin:47},
  {id:'prod-11',name:'Cookie Box (12pc)',    cat:'Cookie Box',     emoji:'🍪', cost:220, sell:399, margin:45},
  {id:'prod-12',name:'Chocolate Box (10pc)', cat:'Chocolate Box',  emoji:'🍬', cost:350, sell:649, margin:46},
];

const DEFAULT_LABOUR = {
  rates: { head: 200, deco: 180, pack: 100, delivery: 150, min: 100 },
  times: { prep: 30, bake: 45, decoSimple: 30, decoComplex: 120, pack: 15 }
};

const DEFAULT_OVERHEAD = {
  fixed: { rent: 15000, elec: 3000, gas: 1500, internet: 500, clean: 1000, days: 25, orders: 3 },
  toggles: { elec: true, gas: true, water: true, rent: true, clean: true, depr: false, admin: false, gst: false }
};

// ── SheetsClient Class ────────────────────────────────────────
class SheetsClient {
  constructor() {
    this.spreadsheetId = null;
    this.sheets = null;
    this._sheetIdCache = {};
  }

  // ── Initialise auth & ensure schema ─────────────────────────
  async init() {
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error('SPREADSHEET_ID not set in .env');

    const rawCreds = process.env.GOOGLE_CREDENTIALS;
    if (!rawCreds) throw new Error('GOOGLE_CREDENTIALS not set in .env');

    let credentials;
    try {
      credentials = JSON.parse(rawCreds);
      if (credentials.private_key) {
        // Safe non-sensitive debugging logs to find formatting issues
        console.log('🔑  [Debug] Key length:', credentials.private_key.length);
        console.log('🔑  [Debug] Key starts with header:', credentials.private_key.trim().startsWith('-----BEGIN PRIVATE KEY-----'));
        console.log('🔑  [Debug] Key ends with header:', credentials.private_key.trim().endsWith('-----END PRIVATE KEY-----'));
        console.log('🔑  [Debug] Key contains actual newlines:', credentials.private_key.includes('\n'));
        console.log('🔑  [Debug] Key contains escaped newlines (\\n):', credentials.private_key.includes('\\n'));
        
        credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
      } else {
        console.log('❌  [Debug] private_key field is missing or empty in JSON!');
      }
    } catch (e) {
      console.error('❌  [Debug] JSON.parse failed:', e.message);
      console.error('📋  [Debug] Value starts with:', rawCreds ? rawCreds.trim().substring(0, 40) : 'empty');
      throw new Error('GOOGLE_CREDENTIALS is not valid JSON. Check your .env file.');
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient();
    this.sheets = google.sheets({ version: 'v4', auth: client });
    this.spreadsheetId = spreadsheetId;

    await this._ensureSchema();
  }

  // ── Schema & seed ─────────────────────────────────────────────
  async _ensureSchema() {
    const meta = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
    const existing = new Set(meta.data.sheets.map(s => s.properties.title));

    // Cache sheet IDs for deleteRow
    meta.data.sheets.forEach(s => {
      this._sheetIdCache[s.properties.title] = s.properties.sheetId;
    });

    const missing = Object.keys(SHEETS).filter(name => !existing.has(name));

    if (missing.length > 0) {
      // Create missing sheet tabs
      const addReqs = missing.map(name => ({ addSheet: { properties: { title: name } } }));
      const batchRes = await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests: addReqs },
      });

      // Cache new sheet IDs
      batchRes.data.replies.forEach((reply, i) => {
        if (reply.addSheet) {
          const name = missing[i];
          this._sheetIdCache[name] = reply.addSheet.properties.sheetId;
        }
      });

      // Write headers to new sheets
      for (const name of missing) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${name}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [SHEETS[name]] },
        });
      }
    }

    await this._seedDefaults();
  }

  async _seedDefaults() {
    // Seed ingredients
    const ings = await this.getAll('Ingredients');
    if (ings.length === 0) {
      console.log('  📋 Seeding default ingredients...');
      for (const item of DEFAULT_INGREDIENTS) {
        item.rateHistory = [{ date: item.updated, timestamp: Date.now(), oldRate: 0, newRate: item.rate }];
        await this.append('Ingredients', item);
      }
    }

    // Seed packaging
    const packs = await this.getAll('Packaging');
    if (packs.length === 0) {
      console.log('  📦 Seeding default packaging...');
      for (const item of DEFAULT_PACKAGING) {
        item.rateHistory = [{ date: new Date().toLocaleDateString('en-IN'), timestamp: Date.now(), oldRate: 0, newRate: item.rate }];
        await this.append('Packaging', item);
      }
    }

    // Seed products
    const prods = await this.getAll('Products');
    if (prods.length === 0) {
      console.log('  🛒 Seeding default products...');
      for (const item of DEFAULT_PRODUCTS) {
        await this.append('Products', item);
      }
    }

    // Seed settings
    const settings = await this.getAll('Settings');
    const hasLabour = settings.some(s => s.key === 'labour');
    const hasOverhead = settings.some(s => s.key === 'overhead');
    if (!hasLabour) await this.append('Settings', { key: 'labour', value: DEFAULT_LABOUR });
    if (!hasOverhead) await this.append('Settings', { key: 'overhead', value: DEFAULT_OVERHEAD });
  }

  // ── Core read ─────────────────────────────────────────────────
  async getAll(sheetName) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map((row, i) => {
      const obj = { _rowIndex: i + 2 }; // 2 = header(1) + 1-based
      headers.forEach((h, j) => {
        let val = row[j] !== undefined ? row[j] : '';
        if (JSON_FIELDS.has(h)) {
          try { val = JSON.parse(val); } catch { val = (h === 'value') ? val : []; }
        } else if (NUMERIC_FIELDS.has(h) && val !== '') {
          val = Number(val);
        } else if (h === 'deleted') {
          val = val === 'true';
        }
        obj[h] = val;
      });
      return obj;
    });
  }

  // ── Core write — append new row ───────────────────────────────
  async append(sheetName, obj) {
    const headers = SHEETS[sheetName];
    const row = this._toRow(headers, obj);
    await this.sheets.spreadsheets.values.append({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
  }

  // ── Core write — update existing row ─────────────────────────
  async updateRow(sheetName, rowIndex, obj) {
    const headers = SHEETS[sheetName];
    const row = this._toRow(headers, obj);
    await this.sheets.spreadsheets.values.update({
      spreadsheetId: this.spreadsheetId,
      range: `${sheetName}!A${rowIndex}`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });
  }

  // ── Core write — delete row (hard) ───────────────────────────
  async deleteRow(sheetName, rowIndex) {
    let sheetId = this._sheetIdCache[sheetName];
    if (sheetId === undefined) {
      // refresh cache
      const meta = await this.sheets.spreadsheets.get({ spreadsheetId: this.spreadsheetId });
      meta.data.sheets.forEach(s => { this._sheetIdCache[s.properties.title] = s.properties.sheetId; });
      sheetId = this._sheetIdCache[sheetName];
    }
    if (sheetId === undefined) throw new Error(`Sheet "${sheetName}" not found`);

    await this.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.spreadsheetId,
      requestBody: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-based
              endIndex: rowIndex,
            },
          },
        }],
      },
    });
  }

  // ── Helper: object → row array ────────────────────────────────
  _toRow(headers, obj) {
    return headers.map(h => {
      const val = obj[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'boolean') return val ? 'true' : '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });
  }

  // ── Audit log helper ─────────────────────────────────────────
  async addLog(action, details) {
    await this.append('AuditLog', {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      date: new Date().toLocaleString('en-IN'),
      action,
      details: details || '',
    });
  }
}

module.exports = new SheetsClient();
