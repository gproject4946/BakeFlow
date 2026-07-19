# 🎂 BakeFlow ERP

> A full-stack, multi-tenant Enterprise Resource Planning system built specifically for bakery businesses — production-ready, deployed on [Render](https://render.com) with a Neon PostgreSQL backend.

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start (Local)](#quick-start-local)
4. [Environment Variables](#environment-variables)
5. [Deploying to Render](#deploying-to-render)
6. [Navigating the App](#navigating-the-app)
7. [Project Structure](#project-structure)
8. [API Reference](#api-reference)
9. [Multi-Tenancy & Security](#multi-tenancy--security)
10. [Plans & Quotas](#plans--quotas)
11. [Public Website Integration](#public-website-integration)

---

## Overview

BakeFlow ERP is a modern, cloud-first bakery management platform covering:

| Module | What it does |
|---|---|
| **Ingredients** | Track raw material inventory, rates, and low-stock alerts |
| **Packaging** | Manage packaging SKUs and stock levels |
| **Products** | Build product catalog with auto-calculated costs and margins |
| **Orders** | Manage custom cake orders and delivery schedules |
| **Sales & Invoices** | Create GST invoices, send via WhatsApp (Twilio), export PDFs |
| **Customers** | CRM — customer history, total spend, order frequency |
| **AI Invoice Scan** | Scan supplier invoices with Gemini Vision to auto-fill ingredient stock |
| **Costing Calculator** | Labour + overhead + ingredient cost analysis |
| **Audit Log** | Full activity trail of every action by every employee |
| **Team Access** | Manage employee accounts, monitor login history and sessions |
| **Admin Console** | Platform-level tenant management (separate `/admin` portal) |
| **Public API** | REST API (`/v1/products`, `/v1/stock`, `/v1/orders`) for website integration |

---

## Architecture

```
Browser
  │
  ├── frontend/index.html        ← Main bakery ERP app (vanilla JS SPA)
  ├── frontend/team.html         ← Employee access monitor
  ├── frontend/admin/index.html  ← Platform admin console
  ├── frontend/signup.html       ← Public self-serve access request page
  │
  └── [HTTP / JWT]
       │
  backend/server.js              ← Express server (Node.js)
       │
       ├── /api/auth             ← Google OAuth + employee password login
       ├── /api/team             ← Employee CRUD + session history
       ├── /api/ingredients      ← Ingredient inventory
       ├── /api/packaging        ← Packaging inventory
       ├── /api/products         ← Product catalog
       ├── /api/orders           ← Custom orders
       ├── /api/sales            ← Sales invoices + WhatsApp
       ├── /api/invoice          ← Gemini Vision invoice scan
       ├── /api/customers        ← CRM
       ├── /api/settings         ← Overhead, labour, business settings
       ├── /api/audit            ← Read-only audit trail
       ├── /api/export           ← CSV downloads (DPDP compliance)
       ├── /api/api-keys         ← Website integration key management
       ├── /api/admin            ← Platform admin routes (protected)
       └── /v1/products|stock|orders  ← Public REST API (X-API-Key auth)
              │
       backend/sheets/sheetsClient.js  ← Prisma ORM layer
              │
       Neon PostgreSQL (cloud)         ← Single DB, isolated by tenantId
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- A [Neon](https://console.neon.tech) free PostgreSQL database

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/gproject4946/BakeFlow.git
cd BakeFlow

# 2. Install backend dependencies
cd backend
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# 4. Apply the database schema
npx prisma db push

# 5. Start the server
npm start
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string (`postgresql://...?sslmode=require`) |
| `JWT_SECRET` | ✅ | Long random string for signing JWTs (e.g. `openssl rand -hex 32`) |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com) |
| `ADMIN_PASSWORD` | ✅ | Password that owner enters alongside Google Sign-in |
| `PLATFORM_ADMIN_EMAIL` | ✅ | Your Google email — grants access to `/admin` console |
| `GEMINI_API_KEY` | ⚠️ | Required for AI invoice scanning ([Google AI Studio](https://aistudio.google.com)) |
| `TWILIO_ACCOUNT_SID` | ⚠️ | Required for WhatsApp invoices ([Twilio Console](https://console.twilio.com)) |
| `TWILIO_AUTH_TOKEN` | ⚠️ | Twilio auth token |
| `TWILIO_FROM` | ⚠️ | Twilio sender number (`whatsapp:+14155238886`) |
| `BUSINESS_NAME` | Optional | Bakery name shown in invoices |
| `BUSINESS_PHONE` | Optional | Phone shown in WhatsApp messages |
| `JWT_EXPIRY` | Optional | Token expiry (default `7d`) |
| `PORT` | Optional | Server port (default `3000`) |

---

## Deploying to Render

### 1. Fork / push to GitHub
Push your code (make sure `.env` is in `.gitignore` ✅).

### 2. Create a Render Web Service
- Go to [render.com](https://render.com) → **New** → **Web Service**
- Connect your GitHub repo
- Set the following:

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node server.js` |
| **Environment** | Node |

### 3. Add Environment Variables in Render Dashboard
Add all variables from the table above in **Environment** → **Add Environment Variable**.

### 4. First Deploy
- Render will build and deploy automatically.
- The first boot seeds your database with default ingredients, packaging, products, and settings.

> **Note**: The frontend is served statically from the `frontend/` folder by Express — no separate frontend deployment needed.

---

## Navigating the App

### 🌐 Public Pages (no login needed)
| URL | Description |
|---|---|
| `/signup` | Request access to BakeFlow as a new bakery |

### 🔐 Bakery App (Owner / Admin / Employee login)
| URL | Who | Description |
|---|---|---|
| `/` | Everyone | Main ERP app — login screen |
| `/team` | Owner / Admin only | Employee access monitor — members, login history, add/deactivate employees |

After login, the main app has these **sidebar sections**:

| Nav Item | Role | What it does |
|---|---|---|
| Dashboard | All | KPIs: revenue, stock alerts, top products |
| Ingredients | All | View stock; Admin/Owner can add, edit, update rates |
| Packaging | All | Same as ingredients |
| Products | All | Catalog with costing breakdown |
| Orders | All | Custom order management |
| Sales | All | Create invoice, WhatsApp delivery, PDF export |
| Customers | All | CRM with order history |
| Scan Invoice | Admin/Owner | AI-powered supplier invoice scanner |
| Costing | Admin/Owner | Labour + overhead cost calculator |
| Reports | Admin/Owner | Revenue, product performance, trend analysis |
| Settings | Owner | Business config, labour rates, overhead |
| Audit Log | Admin/Owner | Full activity trail |
| Team Access | Owner/Admin | Employee management (→ `/team`) |

### 🏛️ Platform Admin Console
| URL | Who | Description |
|---|---|---|
| `/admin` | Platform Admin only | Manage all bakery tenants, approve access requests, view platform metrics |

---

## Project Structure

```
BakeFlow/
├── backend/
│   ├── server.js                 # Express entry point
│   ├── package.json
│   ├── .env.example              # Template — copy to .env
│   ├── prisma/
│   │   └── schema.prisma         # Database schema (all models)
│   ├── prisma.config.js          # Prisma CLI config
│   ├── middleware/
│   │   ├── auth.js               # JWT verification + tenant/trial checks
│   │   ├── requireRole.js        # Role-based access control
│   │   ├── tenantContext.js      # AsyncLocalStorage tenant scoping
│   │   └── quotaEnforcer.js      # AI scan + WhatsApp monthly quotas
│   ├── routes/
│   │   ├── auth.js               # Login (Google + employee) + request-access
│   │   ├── ingredients.js
│   │   ├── packaging.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   ├── sales.js              # Invoices + WhatsApp (Twilio)
│   │   ├── invoice.js            # Gemini Vision invoice scan
│   │   ├── customers.js
│   │   ├── settings.js
│   │   ├── audit.js
│   │   ├── team.js               # Employee CRUD + session log
│   │   ├── export.js             # CSV downloads
│   │   ├── apiKeys.js            # Website integration keys
│   │   ├── publicApi.js          # /v1 public REST API
│   │   └── admin.js              # Platform admin (tenants, metrics)
│   └── sheets/
│       └── sheetsClient.js       # Prisma ORM wrapper (all DB calls)
│
├── frontend/
│   ├── index.html                # Main ERP app
│   ├── team.html                 # Employee access monitor
│   ├── signup.html               # Public request-access page
│   ├── admin/
│   │   └── index.html            # Platform admin console
│   ├── css/
│   │   └── (styles)
│   └── js/
│       ├── app.js                # Main app logic
│       ├── api.js                # API client helpers
│       └── widget.js             # Embeddable product catalog widget
│
├── DATABASE_SETUP.md             # Step-by-step Neon DB setup guide
├── .gitignore
└── README.md
```

---

## API Reference

All API endpoints require a `Bearer <JWT>` token (except `/api/auth/*` and `/v1/*`).

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/google` | Login with Google ID token + admin password |
| `POST` | `/api/auth/employee` | Login with username + password |
| `GET` | `/api/auth/employees` | List employee names (for login dropdown) |
| `GET` | `/api/auth/config` | Fetch `GOOGLE_CLIENT_ID` and `BUSINESS_NAME` |
| `POST` | `/api/auth/request-access` | Submit a new bakery onboarding request (public) |

### Team & Sessions
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/team` | List all team members (with last login) |
| `POST` | `/api/team` | Create new employee account |
| `PUT` | `/api/team/:id` | Update name, role, active status, or reset password |
| `DELETE` | `/api/team/:id` | Soft-delete (deactivate) employee |
| `GET` | `/api/team/sessions` | All login sessions (last 90 days) |
| `GET` | `/api/team/sessions/:userId` | Sessions for a specific employee |
| `POST` | `/api/team/logout` | Record logout time for a session |

### Public REST API (X-API-Key auth)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/v1/products` | Product catalog |
| `GET` | `/v1/stock` | Ingredient + packaging stock levels |
| `POST` | `/v1/orders` | Place an order from external website |
| `GET` | `/v1/orders/:invoiceNumber/status` | Check order status |

### Data Export
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export/ingredients` | Download ingredients as CSV |
| `GET` | `/api/export/packaging` | Download packaging as CSV |
| `GET` | `/api/export/products` | Download products as CSV |
| `GET` | `/api/export/sales` | Download all sales invoices as CSV |
| `GET` | `/api/export/customers` | Download customer list as CSV |

---

## Multi-Tenancy & Security

- Every database row has a `tenantId` column.
- Prisma queries are auto-scoped via `AsyncLocalStorage` — no route needs to manually pass `tenantId`.
- JWTs carry `tenantId`, `role`, and `userId` — extracted on every request by `auth.js` middleware.
- Cross-tenant data leakage is architecturally impossible — the query extension rejects any query missing `tenantId`.
- Platform Admins (identified by `PLATFORM_ADMIN_EMAIL` or the `PlatformAdmin` table) bypass all tenant and role checks.
- Suspended tenants are locked out in real-time (checked on every request).

---

## Plans & Quotas

| Feature | Free Beta | Starter | Pro |
|---|---|---|---|
| Duration | 2 months | Ongoing | Ongoing |
| Gemini AI scans/month | 30 | 200 | 1,000 |
| WhatsApp messages/month | 50 | 500 | 2,000 |
| Max bakeries (Free Beta) | **5 total** | Unlimited | Unlimited |

> Quotas are enforced automatically against the `AuditLog` table — no separate counter table needed.

---

## Public Website Integration

Generate an API key at `Settings → API Keys` in the app, then:

### Embed product catalog on any website
```html
<div id="bakeflow-widget"></div>
<script src="https://your-render-url.onrender.com/js/widget.js?key=bfk_YOUR_KEY"></script>
```

### Place orders via REST
```bash
curl -X POST https://your-render-url.onrender.com/v1/orders \
  -H "X-API-Key: bfk_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Rohit Singh","customerPhone":"+919876543210","items":[{"name":"Chocolate Cake","qty":1,"price":950}]}'
```

### Webhook notifications
Configure your webhook URL in `Settings → Webhooks`. BakeFlow sends HMAC-SHA256 signed `POST` requests to your endpoint on:
- `order.placed` — when a new order arrives via the public API

---

*Built with ❤️ using Node.js, Express, Prisma, Neon PostgreSQL, and vanilla JS.*
