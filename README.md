# 🎂 BakeFlow ERP — Complete Guide

> **The all-in-one bakery management system** — Cost Calculator · Inventory · Sales Invoicing · WhatsApp Receipts · AI Invoice Scanning · Analytics

[![Live Demo](https://img.shields.io/badge/Live%20App-bakeflow--spo4.onrender.com-gold?style=for-the-badge)](https://bakeflow-spo4.onrender.com)
[![Built With](https://img.shields.io/badge/Built%20With-Node.js%20%7C%20Google%20Sheets%20%7C%20Gemini%20AI-brown?style=for-the-badge)]()

---

## 📖 What is BakeFlow?

BakeFlow is a **complete, cloud-based ERP (Enterprise Resource Planning) system** built exclusively for bakery businesses. It replaces spreadsheets, paper notebooks, and disconnected apps with one elegant, web-based platform that your entire team can access from any device, anywhere.

**Built for bakery owners who want to:**
- Know exactly what every cake, pastry, or bread costs to make.
- Track raw material stock and get alerts before you run out.
- Generate professional sales invoices in seconds.
- Send invoices directly to customers on WhatsApp automatically.
- Scan paper supplier invoices with AI — no manual data entry.
- Monitor all business activity with a full audit trail.

**Zero monthly database fees.** Your entire business data is stored securely in a **Google Sheet** you own — giving you full control, zero vendor lock-in, and the ability to view your data directly in a familiar spreadsheet at any time.

---

## ✨ Feature Overview

| Module | What it does |
|---|---|
| 🔑 **Role-Based Login** | Google Sign-In with Admin/Employee access levels and password verification |
| 📊 **Dashboard** | Live KPIs — revenue, margins, low stock alerts, recent invoices |
| 🧮 **Cost Calculator** | Recipe-based cost breakdown per product with live margin calculation |
| 📦 **Raw Materials Master** | Full ingredient & packaging inventory with stock tracking and alerts |
| 🤖 **AI Invoice Scanner** | Scan paper supplier invoices with Gemini AI — auto-imports items into inventory |
| 🛒 **Product Catalog** | Pre-defined products with calculated selling prices for quick invoice creation |
| 🧾 **Sales Invoicing** | Professional invoice builder with live PDF-quality preview and auto-numbering |
| 💬 **WhatsApp Receipts** | One-click send of formatted invoice receipts to customer WhatsApp via Twilio |
| 👥 **Customer Database** | Complete customer profiles with order history, total spend, and last order date |
| 📈 **Analytics** | Revenue charts, profit margins, best-selling products — Admin only |
| 🗂️ **Audit Log** | Tamper-proof chronological log of every action taken by every employee |
| ⚙️ **Settings** | Labour costs, overhead configuration, and staff management |

---

## 🏗️ System Architecture

```
                         ┌──────────────────────────────────┐
                         │       Google Sheets Database      │
                         │  Staff · AuditLog · Customers    │
                         │  SalesInvoices · Ingredients     │
                         │  Packaging · Products · Settings │
                         └───────────────┬──────────────────┘
                                         │ (sheetsClient.js — live R/W)
                                         ▼
 ┌─────────────────┐      ┌──────────────────────────────────┐      ┌─────────────────┐
 │   Gemini AI     │─────►│      BakeFlow ERP Server         │◄─────│   Twilio API    │
 │  (v1 REST API)  │      │     (Express.js · Node.js)       │      │  (WhatsApp SMS) │
 │  Invoice OCR    │      │   REST API · Auth · Business     │      │  Invoice Send   │
 └─────────────────┘      └───────────────▲──────────────────┘      └─────────────────┘
                                          │
                                          │ (HTTPS API Calls)
                                          ▼
                          ┌──────────────────────────────────┐
                          │      BakeFlow SPA Frontend        │
                          │  Vanilla HTML · CSS · JavaScript  │
                          │  Google Sign-In · Live Calculator │
                          │  Responsive · Dark Brown Theme    │
                          └──────────────────────────────────┘
```

---

## 🔑 Module 1 — Role-Based Login & Access Control

### How it works:
1. Visit the BakeFlow URL in any browser.
2. Click **"Sign in with Google"** — uses your existing Google account (no new password needed).
3. After sign-in, a modal appears asking you to select your **role** (Admin or one of up to 5 named employees) and enter your designated **role password**.
4. Access is granted based on your role.

### Access Levels:
| Feature | Employee | Admin |
|---|---|---|
| Dashboard (basic stats) | ✅ | ✅ |
| Cost Calculator | ✅ | ✅ |
| Raw Materials | ✅ | ✅ |
| Product Catalog | ✅ | ✅ |
| New Invoice | ✅ | ✅ |
| All Invoices | ✅ | ✅ |
| Customers | ✅ | ✅ |
| Full Analytics | ❌ | ✅ |
| Labour & Overhead Settings | ❌ | ✅ |
| Audit Log | ❌ | ✅ |
| Financial KPIs on Dashboard | ❌ | ✅ |

---

## 📊 Module 2 — Dashboard

The dashboard is your **business health check** — it loads instantly when you log in and shows:

- **This Month Revenue** — total sales generated this month.
- **Total Customers** — number of customers in your database.
- **Total Invoices** — number of sales invoices created.
- **Avg. Profit Margin** — average margin across all products in your catalog.
- **Total Products** — number of products in your catalog.
- **Saved Orders** — number of cost calculations saved for reference.
- **Highest Margin Product** — your most profitable product.
- **Low Stock Alerts** — number of raw materials that have fallen below their minimum threshold.
- **Quick Calculations** — one-click jump to your most recently used product calculators.
- **Recent Invoices** — your last few sales at a glance.

---

## 🧮 Module 3 — Cost Calculator

The **heart of BakeFlow** — built specifically for bakeries to calculate the exact cost of making any product.

### How to use it:
1. Type your product name (e.g., "Rasmalai Cake").
2. Select the **category** (Fusion Cake, Signature Cake, Brownie, etc.).
3. Set the **batch size** (how many units per recipe).
4. Add **ingredients** — search by name, enter quantity and unit. The rate is auto-filled from your Raw Materials Master.
5. Add **packaging** — boxes, ribbons, bags, etc.
6. Add **decorations** if needed.
7. Enter the **selling price** you plan to charge.
8. The calculator shows in real-time:
   - **Total Ingredient Cost**
   - **Packaging Cost**
   - **Labour Cost** (based on your configured hourly rate × hours)
   - **Overhead Cost** (electricity, rent share per batch)
   - **Total Cost Price**
   - **Profit Amount & Margin %**

> 💡 **Tip:** If your margin is below 30%, the app warns you in orange. Below 10%, it shows red.

### Saving & Loading:
- Click **Save Order** to store a calculation for future reference.
- Saved orders appear in the **Saved Orders** section and on the Dashboard quick panel.
- Click **Add to Catalog** to permanently add the product to your catalog for quick invoice creation.

### ⚖️ Smart Name-Based Unit Conversion
BakeFlow features a highly advanced, automated unit conversion engine. When you buy raw materials as packages (e.g. packets, pieces, boxes) but use them in recipes by weight or volume (e.g. grams, milliliters), BakeFlow automatically handles the math:
* **Automatic Name Parsing:** The system parses package weights/volumes directly from item names (e.g. matching `"100 GM."`, `"2 KG."`, `"30ML"`).
* **Smart Defaults:** When you add an ingredient to a recipe (like `"AMUL BUTTER UNSALTED 100 GM."` which has a master unit of `piece`), the calculator automatically senses the weight in the name and defaults the dropdown unit to `g` (grams).
* **Dynamic Rate Scaling:** When switching units:
  * **Piece to Grams:** ₹62 per 100g piece automatically scales to **₹0.62 per gram**.
  * **Piece to Kilograms:** Automatically scales to **₹620 per kg**.
  * **Piece to Milliliters:** A ₹30 extract of 30ml automatically scales to **₹1.00 per ml**.

---

## 📦 Module 4 — Raw Materials Master

Your **complete inventory management system** for both ingredients and packaging materials.

### The two tabs:
- **🥛 Ingredients tab** — Flour, butter, sugar, cream, chocolate, fruits, spices, etc.
- **📦 Packaging tab** — Boxes, bags, ribbons, labels, stickers, etc.

### Each item shows:
| Column | Description |
|---|---|
| Name | Item name |
| Category / Type | e.g. Dairy, Dry, Fruit / Box, Bag |
| Unit | kg, g, litre, ml, piece, packet, etc. |
| Rate (₹) | Current purchase price per unit |
| Stock Qty | How much you currently have in stock |
| Min Alert | Minimum threshold — warns you when stock falls below this |
| Status | 🔴 Out of Stock · 🟡 Low Stock · 🟢 In Stock |
| Last Updated | Date of last rate or stock update |

### Key actions:
- **Update** button — Edit rate, stock quantity, or minimum alert threshold inline.
- **Delete** button — Soft-deletes the item (can be recovered using the "Show deleted" toggle).
- **+ Add Item** — Manually add a new ingredient or packaging item.
- **🤖 Scan Invoice** — AI-powered scanner (see Module 5 below).

### Stock Alerts:
Low stock items automatically appear in the **Dashboard** under "Low Stock Alerts" so you never run out of a critical ingredient mid-production.

### 📦 Stock Tracking & Fractional Depletion
Because ingredients can be purchased as packets/bottles but used in precise recipe measurements, stock levels support fractional quantities:
* **Automated Recipe Depletion on Sale:** When a sales invoice is saved or sent via WhatsApp, BakeFlow automatically locates the matching recipe in your saved calculations, calculates the exact quantities of ingredients, packaging, and decorations used (scaled by the number of units sold and batch size), and automatically deducts them from your inventory in real-time.
* **Auto-Restoration on Invoice Delete:** If you delete a sales invoice, BakeFlow automatically performs the reverse calculation and returns all consumed ingredients, packaging, and decorations back to your inventory stock. This ensures perfect accountability for trial sales or invoice errors.
* **Decimal Stock Tracking:** If you consume `20g` of a `100g` packet of butter, the system calculates that as `0.2` pieces consumed, and deducts exactly `0.2` from your stock count.
* **Perpetual Quantities:** Stock goes up automatically via the **AI Supplier Invoice Scanner**, down automatically on sales, and is restored automatically on deletions. You can also manually audit/correct quantities in the inventory table to maintain a real-time record.
* **Audit Trail:** Every manual, scanned, depleted, or restored stock adjustment creates a corresponding log entry in the Admin Audit Log for full accountability.

---

## 🤖 Module 5 — AI Supplier Invoice Scanner

One of BakeFlow's most powerful features — **scan a paper purchase invoice with your phone camera** and let Gemini AI extract all the line items automatically.

### Step-by-step:
1. Go to **Raw Materials** → click **🤖 Scan Invoice** (top right corner).
2. The scan modal opens. Drag and drop or click to upload a photo of your supplier's invoice.
   - Supported formats: **JPG, JPEG, PNG, WebP, HEIC**
   - Maximum size: **10 MB**
   - You'll see an **upload progress animation** and a live status message ("Uploading image to Gemini AI…", "Reading your invoice…", etc.)
3. Once processed, the detected items appear in an editable table:
   - **Name** — Auto-extracted item name
   - **Qty** — Quantity purchased
   - **Unit** — kg, packet, piece, etc.
   - **Rate (₹)** — Price per unit
   - **Type** — Ingredient or Packaging (you can change this)
   - **Checkbox** — Uncheck any item you don't want to import
4. Check **"Also update stock quantity from invoice quantities"** (checked by default) to automatically add the purchased quantity to your current stock.
5. Click **Import Selected Items**.

### Smart duplicate detection:
- If an item **already exists** in your inventory, BakeFlow will **add the purchased quantity to the existing stock** instead of creating a duplicate entry.
- If an item is **new**, a fresh entry is created.
- The final toast notification tells you exactly: **"X new items added, Y restocked"**.

> 💡 **Tip:** The AI works best with clear, well-lit photos. Flat invoices on a table photograph better than crumpled ones held in hand.

---

## 🛒 Module 6 — Product Catalog

A library of your **standard products** that you sell regularly.

Each product in the catalog stores:
- Product name and category
- Calculated cost price (from the Cost Calculator)
- Suggested selling price and profit margin
- Emoji icon for visual identification

### Adding products to the catalog:
1. Run a calculation in the **Cost Calculator**.
2. Click **Add to Catalog** at the bottom of the calculator screen.
3. Set a selling price → the product is saved permanently.

### Using the catalog in invoices:
When creating a **New Invoice**, click **"From Catalog"** to search and insert a product with its price pre-filled — no typing needed.

---

## 🧾 Module 7 — Sales Invoice Generator

Create **professional, print-ready sales invoices** in under 30 seconds.

### The 3-step invoice builder:

**Step 1 — Customer:**
- Search your customer database by name or phone number.
- Click to select → customer name, phone, and city are auto-filled.
- Or click **+ New** to add a new customer on the fly.

**Step 2 — Items:**
- Click **From Catalog** to add a catalog product (price pre-filled).
- Or click **Custom Item** to type a one-off item name and price.
- Adjust quantity for each item.
- Add as many items as needed.

**Step 3 — Totals & Options:**
- Set **GST %** (0%, 5%, 12%, 18%, 28%).
- Enter **Discount (₹)** if applicable.
- Select **Payment Method** (Cash, UPI, Card, Credit).
- Add a **Note** (e.g., "Birthday cake", "Wedding order").

The **live invoice preview** on the right updates in real-time, showing exactly what the printed invoice will look like.

### Saving & actions:
| Button | What it does |
|---|---|
| **Save Invoice** | Saves to Google Sheets, auto-assigns invoice number (INV-2026-0001) |
| **WhatsApp** | Sends formatted receipt to customer's WhatsApp before saving |
| **Print / PDF** | Opens browser print dialog — invoice is formatted for A4/receipt paper |
| **Reset** | Clears the form to start fresh |

---

## 💬 Module 8 — WhatsApp Receipts (Twilio)

After creating an invoice, send a **professionally formatted receipt** directly to the customer's WhatsApp number with one click.

### The message the customer receives:
```
🎂 BakeFlow

Hello Kartik! 👋

Thank you for your order. Here's your invoice:

🧾 INV-2026-0005
📅 13/07/2026

📦 Items:
• Rasmalai Cake × 1 — ₹950.00

💰 Subtotal: ₹950.00
🏷 GST (5%): ₹47.50
🎁 Discount: − ₹25.00
──────────────────
✅ Total: ₹972.50
💳 Cash

📝 Birthday order

We hope you love it! 🙏
See you again soon ✨

— BakeFlow
📞 +91 98765 43210

_Invoice by: Admin_
```

### Requirements:
- **Twilio account** (free sandbox available for testing).
- Customer phone number must include country code (Indian numbers: `+91XXXXXXXXXX`). BakeFlow automatically formats 10-digit numbers.
- For the **sandbox (testing):** each recipient must once send `join <code>` to your Twilio sandbox number on WhatsApp.
- For **production (live customers):** apply for a Twilio WhatsApp Business number — any customer can then receive messages without any opt-in step.

---

## 👥 Module 9 — Customer Database

Maintain a complete database of all your customers.

### Each customer profile stores:
- Name, Phone Number, City
- Email and Address (optional)
- Notes (e.g., "Prefers eggless", "Corporate client")
- **Total Orders** — auto-calculated from active invoices (self-heals if data ever gets out of sync)
- **Total Spent** — cumulative amount spent by this customer
- **Last Order Date** — date of most recent invoice

### Auto-sync:
- When you **create an invoice**, the customer's order count and total spend update automatically.
- When you **delete an invoice**, the stats roll back correctly.
- When you visit the Customers page, the system **re-verifies all stats** from live invoice data and self-corrects any discrepancies.

---

## 📈 Module 10 — Analytics (Admin Only)

A full business intelligence dashboard for the bakery owner.

- **Revenue Charts** — monthly and weekly revenue trends.
- **Profit Margin Analysis** — which products have the best margin.
- **Best Sellers** — most frequently invoiced products.
- **Customer Insights** — your highest-value customers.

> Only accessible to users logged in as **Admin**.

---

## 🗂️ Module 11 — Audit Log (Admin Only)

Every action taken in BakeFlow is **permanently recorded** in the Google Sheet's AuditLog tab with:
- **Timestamp** — exact date and time
- **Action type** — e.g., `LOGIN`, `CREATE_SALE`, `UPDATE_STOCK`, `SCAN_INVOICE`, `SEND_WHATSAPP`
- **Employee name and email** — who did it
- **Details** — what was changed (e.g., "Flour stock: 5 → 10 kg")
- **Entity** — which record was affected

This gives you complete **accountability** for all business operations.

---

## ⚙️ Module 12 — Settings

### Labour Settings (Admin only):
Configure staff costs that flow into the Cost Calculator:
- Hourly labour rate (₹ per hour)
- Number of workers per batch
- Hours per batch

### Overhead Settings (Admin only):
Configure fixed business costs spread across batches:
- Electricity cost per month
- Rent per month
- Number of batches produced per month
- The system divides these across batches automatically.

---

## 🛠️ Technical Setup Guide

### Prerequisites
- Node.js v18 or higher
- A Google account
- A Twilio account (free sandbox is fine for testing)
- A Google AI Studio API key (free at [aistudio.google.com](https://aistudio.google.com))

---

### Step 1 — Google Sheets Database

1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a new project (name it `BakeFlow`).
2. Enable the **Google Sheets API**:
   - Go to **APIs & Services → Library** → search "Google Sheets API" → click **Enable**.
3. Create a **Service Account**:
   - Go to **APIs & Services → Credentials → + Create Credentials → Service Account**.
   - Name it `bakeflow-db` → click **Create and Continue → Done**.
4. Generate a **JSON key**:
   - Click the service account email → go to the **Keys** tab → **Add Key → Create new key → JSON** → Download.
   - Paste the entire JSON contents into `GOOGLE_CREDENTIALS` in your `.env`.
5. Create a blank **Google Sheet**. Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`).
6. **Share** the sheet with your service account email address (format: `bakeflow-db@your-project.iam.gserviceaccount.com`) as an **Editor**.

---

### Step 2 — Google Sign-In (OAuth)

1. In Google Cloud Console → **APIs & Services → Credentials → + Create Credentials → OAuth Client ID**.
2. Select **Web Application**. Name it `BakeFlow Web Login`.
3. Under **Authorized JavaScript Origins**, add your server URL (e.g., `https://bakeflow-spo4.onrender.com`).
4. Click **Create** → copy the **Client ID** → paste into `GOOGLE_CLIENT_ID` in `.env`.

---

### Step 3 — Gemini AI API Key (Invoice Scanner)

1. Visit [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
2. Click **Create API key → Create API key in new project**.
3. Copy the generated key → paste into `GEMINI_API_KEY` in `.env`.

> **Note:** The Gemini API (free tier) allows 1,500 invoice scans per day — more than enough for any bakery.

---

### Step 4 — Twilio WhatsApp (Invoice Receipts)

1. Sign up at [twilio.com](https://www.twilio.com).
2. From the Console Dashboard, copy your **Account SID** and **Auth Token**.
3. Go to **Messaging → Try it out → Send a WhatsApp message** to get the sandbox number and join code.
4. Add to Render environment:
   - `TWILIO_ACCOUNT_SID` — starts with `AC...`
   - `TWILIO_AUTH_TOKEN` — 32-character hex string
   - `TWILIO_WHATSAPP_FROM` — `whatsapp:+14155238886` (sandbox) or your registered number

---

### Step 5 — Environment Variables

Create a `backend/.env` file with the following:

```env
# ── Business Identity ────────────────────────────
BUSINESS_NAME=Your Bakery Name
BUSINESS_PHONE=+91 98765 43210
OWNER_NAME=Owner Name

# ── Server ───────────────────────────────────────
PORT=3000

# ── Google Sheets ─────────────────────────────────
SPREADSHEET_ID=your_google_sheets_id_here
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# ── Google Sign-In ────────────────────────────────
GOOGLE_CLIENT_ID=your_oauth_client_id.apps.googleusercontent.com

# ── Role Passwords ────────────────────────────────
ADMIN_PASSWORD=your_secure_admin_password
EMPLOYEE_1_PASSWORD=emp1pass
EMPLOYEE_2_PASSWORD=emp2pass
EMPLOYEE_3_PASSWORD=emp3pass
EMPLOYEE_4_PASSWORD=emp4pass
EMPLOYEE_5_PASSWORD=emp5pass

# ── Employee Names ────────────────────────────────
EMPLOYEE_1_NAME=Employee Name 1
EMPLOYEE_2_NAME=Employee Name 2
EMPLOYEE_3_NAME=Employee Name 3
EMPLOYEE_4_NAME=Employee Name 4
EMPLOYEE_5_NAME=Employee Name 5

# ── Gemini AI (Invoice Scanner) ───────────────────
GEMINI_API_KEY=your_gemini_api_key_here

# ── Twilio WhatsApp ───────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_32_char_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

### Step 6 — Install & Run Locally

```bash
# Clone the repository
git clone https://github.com/gproject4946/BakeFlow.git
cd BakeFlow

# Install backend dependencies
cd backend
npm install

# Start the server (with .env loaded)
npm start
```

Open **http://localhost:3000** in your browser — BakeFlow is running!

---

### Step 7 — Deploy to Render (Production)

1. Push your code to GitHub.
2. Go to [render.com](https://render.com) → **New → Web Service → Connect your GitHub repo**.
3. Set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Under **Environment**, add all the variables from your `.env` file.
5. Click **Deploy**. Render auto-deploys on every GitHub push.

---

## 📱 Real-World Use Cases

### Use Case 1 — Daily Stock Check
> An employee logs in each morning, views the Dashboard, and sees "3 Low Stock Alerts". They navigate to Raw Materials and restock whipped cream (10 litres), eggs (24 pieces), and butter (5 kg). Each update is logged with their name and timestamp.

### Use Case 2 — Supplier Delivery (AI Scan)
> A delivery arrives from the supplier with a paper invoice. The employee opens BakeFlow on their phone, taps **🤖 Scan Invoice**, and photos the invoice. Within seconds, 12 line items appear on screen with names, quantities, and prices. The employee clicks **Import Selected Items** — all 12 items are added to inventory and stock quantities are updated automatically.

### Use Case 3 — Custom Cake Order
> A customer walks in and orders a "Dark Chocolate Truffle Cake" for a wedding. The employee opens the Cost Calculator, enters all ingredients and packaging, sets 20 servings as batch size. The cost comes to ₹850. They set a selling price of ₹1,800 (a 112% margin). They save it to the catalog and create an invoice — the customer receives a WhatsApp receipt immediately.

### Use Case 4 — End-of-Day Review (Admin)
> The bakery owner logs in as Admin at the end of the day. The Dashboard shows ₹14,500 in revenue, 12 invoices, and an average margin of 68%. They check the Audit Log to see all activity by each employee, verify no unexpected actions occurred, and export the Google Sheet for their accountant.

---

## 🔒 Security & Data Privacy

- **No custom database server** — all data lives in your own Google Sheet. You own it entirely.
- **Google OAuth** — authentication is handled by Google's infrastructure. BakeFlow never stores your Google password.
- **Role passwords** are stored in your server's environment variables — never in the database or client-side code.
- **Audit log** captures every action, making it easy to trace any discrepancy.
- **HTTPS** enforced on Render deployments by default.

---

## 🆘 Troubleshooting

| Problem | Solution |
|---|---|
| "Scan failed" / Gemini AI error | Ensure `GEMINI_API_KEY` is from [aistudio.google.com](https://aistudio.google.com), not Google Cloud Console. The correct model is `gemini-3.5-flash`. |
| WhatsApp not delivered | Verify credentials in Render (no spaces in SID/Token). For sandbox, ensure the recipient has sent the join code to the Twilio number. |
| Google Sign-In fails | Add your Render deployment URL to "Authorized JavaScript Origins" in your OAuth Client ID settings. |
| Customer stats wrong (e.g. old order count) | Visit the Customers page — the system automatically self-heals stats by recalculating from live invoice data. |
| Items duplicated after scan | Use the "Show deleted" toggle to find soft-deleted items and permanently delete them, then rescan. |
| Page loads but data is empty | Check that the Google Sheet is shared with your service account email as Editor. |
| Server crashes on startup | Confirm all required environment variables are set in Render, especially `GOOGLE_CREDENTIALS` (must be valid JSON). |

---

## 🗂️ Project Structure

```
BakeFlow/
├── backend/
│   ├── server.js              # Express entry point, static file serving
│   ├── package.json           # Node.js dependencies
│   ├── .env                   # Environment variables (not committed to git)
│   ├── routes/
│   │   ├── auth.js            # Google OAuth verification & role auth
│   │   ├── ingredients.js     # Ingredient CRUD & stock management
│   │   ├── packaging.js       # Packaging CRUD & stock management
│   │   ├── products.js        # Product catalog CRUD
│   │   ├── orders.js          # Saved orders / calculations
│   │   ├── sales.js           # Sales invoices + WhatsApp sending
│   │   ├── customers.js       # Customer database with self-healing stats
│   │   ├── invoice.js         # Gemini AI invoice scanner
│   │   └── settings.js        # Labour & overhead settings
│   └── sheets/
│       └── sheetsClient.js    # Google Sheets API wrapper (read/write/append)
├── frontend/
│   ├── index.html             # Single-page application shell (all pages)
│   ├── css/
│   │   └── style.css          # Complete design system (dark brown theme)
│   └── js/
│       ├── api.js             # Frontend API client (all endpoint wrappers)
│       └── app.js             # Complete frontend logic (SPA routing, state, UI)
└── README.md                  # This file
```

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js + Express.js |
| **Frontend** | Vanilla HTML, CSS, JavaScript (no framework) |
| **Database** | Google Sheets (via Google Sheets API v4) |
| **Authentication** | Google OAuth 2.0 (Sign in with Google) |
| **AI** | Google Gemini 3.5 Flash (invoice OCR via REST API v1) |
| **WhatsApp** | Twilio Programmable Messaging |
| **Hosting** | Render.com (auto-deploy from GitHub) |
| **Icons** | Tabler Icons |
| **Fonts** | System sans-serif (optimised for load speed) |

---

## 📞 Support

For questions, customisations, or enterprise deployment support, contact the BakeFlow development team.

---

*BakeFlow ERP — Baked with ❤️ for bakery businesses.*
