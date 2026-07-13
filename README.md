# 🎂 BakeFlow ERP — Setup & User Guide

BakeFlow is a premium, end-to-end Enterprise Resource Planning (ERP) and Cost Calculator software designed specifically for bakery businesses. It combines advanced recipe-cost calculation, automated inventory/stock management, Google Sign-in with role-based access control, Gemini AI-powered purchase invoice scanning, and real-time customer sales invoicing with automatic WhatsApp delivery via Twilio. 

All persistent data (audit logs, customer profiles, product catalogs, order files, staff credentials) is synced in real-time to a **Google Sheet**, giving bakery owners a zero-cost, cloud-accessible, and highly reliable database.

---

## ✨ Features & Architecture

```
                               ┌────────────────────────────────┐
                               │     Google Sheets Database     │
                               │  (Staff, AuditLog, Customers,  │
                               │   SalesInvoices, Inventory)    │
                               └───────────────┬────────────────┘
                                               │
                                               ▼  (sheetsClient.js)
┌──────────────────┐            ┌────────────────────────────────┐            ┌──────────────────┐
│   Gemini 1.5     ├───────────►│       BakeFlow ERP Server      │◄───────────┤   Twilio API     │
│   Flash AI       │ (Scan base64│        (Express Node.js)       │ (WhatsApp  │  (WhatsApp SMS)  │
│ (Invoice Scan)   │   invoice) │                                │  receipts) │                  │
└──────────────────┘            └───────────────▲────────────────┘            └──────────────────┘
                                                │ (API Endpoints + Auth)
                                                │
                                                ▼
                                ┌────────────────────────────────┐
                                │     BakeFlow SPA Frontend      │
                                │    (Tailored HSL Design, UX,   │
                                │   Google Sign-In, Live Calc)   │
                                └────────────────────────────────┘
```

### 1. 🔑 Google Sign-In & Secure Role Selection
* **Single Sign-On:** Staff can sign in using their official Google accounts.
* **Role Modal:** After Google auth, employees select their role: **Admin** or **Employee**.
* **Password Verification:** Passwords for Admin and Employee positions are defined securely in the server's `.env` configuration file.
* **Access Control:** Employees only have access to day-to-day screens (Dashboard, Calculator, Materials, Sales, Invoices, Customers). Settings, full Analytics, and Audit Logs are hidden and blocked behind server-side and client-side guards for **Admin only**.

### 2. 📊 Merged Raw Materials & Stock Management
* **Single UI Screen:** Ingredients and Packaging are combined into a clean, tabbed Materials Master.
* **Inventory Control:** Track current stock quantity (`stockQty`) and set a minimum alert threshold (`minAlert`).
* **Live Badging:** Auto-displays stock level indicators:
  * 🔴 `Out of Stock` (0 qty)
  * 🟡 `Low Stock` (qty <= threshold)
  * 🟢 `In Stock` (qty > threshold)
* **Inline Updates:** Edit rates, current stock quantities, and alert thresholds directly from the table.

### 3. 🤖 AI Supplier Invoice Scanner
* **Drag-and-Drop:** Upload or drop an image (JPG, PNG, WebP) of any raw material supplier purchase invoice.
* **Gemini 1.5 Flash:** Automatically processes and extracts line items: name, quantity, unit, price, and item type.
* **Editable Preview:** Review the scanned items in an interactive table, modify categories, and import them directly into your database. Stock quantities are automatically incremented!

### 4. 🧾 Sales Invoice Generator
* **Interactive Builder:** Search and select existing customers (or add new ones) to auto-fill details.
* **Catalog Integration:** Add items directly from your pre-calculated product catalog with a single click.
* **Live Printer Preview:** The right side of the screen updates in real-time, matching standard receipt formatting. Prints beautifully with native browser print styling (`@media print`).
* **Auto-Numbering:** Auto-generates sequential, year-prefixed invoice numbers (e.g. `INV-2026-0001`).

### 5. 💬 Twilio WhatsApp Integration
* **Instant Receipts:** After saving an invoice, click a single button to dispatch a beautifully formatted receipt directly to the customer's WhatsApp number.
* **Audit Stamped:** Automatically tracks who sent the receipt and updates the sent status badge (✅ Sent) in your invoice logs.

---

## 🛠️ Step-by-Step Google & Twilio Setup

To deploy and host BakeFlow ERP, you must configure three external integrations:

### 1. Google Sheets Database (Service Account)
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project called `BakeFlow`.
3. Search for **Google Sheets API** in the API Library and **Enable** it.
4. Go to **APIs & Services** -> **Credentials** -> Click **+ Create Credentials** -> **Service Account**.
5. Name it `bakeflow-db` and click **Create and Continue**, then click **Done**.
6. Click on the email of the new service account -> Go to the **Keys** tab -> Click **Add Key** -> **Create new key** -> **JSON** -> Click **Create**.
7. Keep the downloaded JSON file. Paste its entire contents into `GOOGLE_CREDENTIALS` in your `.env`.
8. Create a new Google Sheet. Copy the Spreadsheet ID from the URL.
9. **Share** your Google Sheet with the Service Account email as an **Editor**.

### 2. Google Sign-In (OAuth Client ID)
1. Go back to **APIs & Services** -> **Credentials**.
2. Click **+ Create Credentials** -> **OAuth client ID**.
3. Select **Web application** as the application type.
4. Name it `BakeFlow Web Login`.
5. Under **Authorized JavaScript origins**, click **+ Add URI** and add your domain (e.g., `http://localhost:3000` or your production server domain).
6. Click **Create** and copy the Client ID. Paste it into `GOOGLE_CLIENT_ID` in your `.env`.

### 3. Twilio API (WhatsApp)
1. Sign up for a free account on [Twilio](https://www.twilio.com).
2. Set up the **Twilio Sandbox for WhatsApp** in the Twilio Console.
3. Obtain your **Account SID**, **Auth Token**, and your Sandbox WhatsApp sender number (usually `whatsapp:+14155238886`).
4. Paste these values into the Twilio variables in your `.env` file.

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file inside the `backend/` folder. Use the following template:

```env
# App Identity
BUSINESS_NAME=BakeFlow
BUSINESS_PHONE=+91 98765 43210
OWNER_NAME=User

# Server Configuration
PORT=3000

# Google Sheets Database
SPREADSHEET_ID=your_google_sheets_spreadsheet_id
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}

# Google Sign-In
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com

# Role Passwords (matching employees)
ADMIN_PASSWORD=admin123
EMPLOYEE_1_PASSWORD=emp1pass
EMPLOYEE_2_PASSWORD=emp2pass
EMPLOYEE_3_PASSWORD=emp3pass
EMPLOYEE_4_PASSWORD=emp4pass
EMPLOYEE_5_PASSWORD=emp5pass

# Employee Names
EMPLOYEE_1_NAME=Employee 1
EMPLOYEE_2_NAME=Employee 2
EMPLOYEE_3_NAME=Employee 3
EMPLOYEE_4_NAME=Employee 4
EMPLOYEE_5_NAME=Employee 5

# Gemini AI (For Invoice Scanning)
GEMINI_API_KEY=your_gemini_api_key_here

# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_twilio_sid_here
TWILIO_AUTH_TOKEN=your_twilio_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## 🏃 Installation & Running

```bash
# Clone the repository
git clone https://github.com/gproject4946/BakeFlow.git
cd BakeFlow

# Install backend dependencies
cd backend
npm install

# Start the server
npm start
```
BakeFlow will run at **http://localhost:3000**!

---

## 📘 End-to-End User Experience & Use Cases

Here is how different actors interact with BakeFlow ERP:

### Use Case 1: Employee Logs In & Checks Low Stock
1. **Google Auth:** Employee (e.g. Employee 1) visits the web app, clicks "Sign in with Google", and signs in.
2. **Role Verification:** They select "Employee" in the modal and type their designated password (`emp1pass`).
3. **Dashboard Load:** The greeting changes to "Good morning, Employee 1 ✦". The simplified dashboard reveals no financial logs but flags **2 Low Stock Alerts** in the inventory widget.
4. **Restock Check:** The employee navigates to the **Raw Materials** tab. They see that "Whipped Cream" is flagged yellow (`⚠️ Low (2 kg)`). They manually add 10 kg to the stock, which triggers an audit log entry.

### Use Case 2: Scanning a Supplier Purchase Invoice
1. **Purchase Arrival:** A delivery of flour and butter arrives from the supplier with a paper invoice.
2. **AI Upload:** The employee goes to **Raw Materials** -> clicks **🤖 Scan Invoice**.
3. **Image Process:** They drop the photo of the invoice. Gemini reads the image, identifies line items, parses their quantities/prices, and outputs them as a clean table.
4. **Confirm Stock:** The employee verifies the values, checks "Update stock quantities", and clicks **Import**. The system inserts the items into the sheets database and updates the stock, creating an `UPDATE_STOCK` audit log entry.

### Use Case 3: Creating a Customer Sales Invoice & Sending WhatsApp
1. **Customer Order:** A customer named "Karan" walks in to buy a "Rasmalai Cake" (₹1,200).
2. **Invoice Builder:** Employee 1 clicks **New Invoice**.
3. **Select Customer:** They search for "Karan". His profile pops up with his phone number and city. They click to select.
4. **Catalog Selection:** They click **Add from Catalog**, select "Rasmalai Cake". The unit price ₹1,200 is loaded.
5. **WhatsApp Dispatch:** The employee clicks **Send WhatsApp & Save**.
   * The invoice is written to the `SalesInvoices` sheet as `INV-2026-0001`.
   * Karan receives a formatted WhatsApp message from BakeFlow details:
     ```
     🎂 BakeFlow
     Hello Karan! 👋
     Thank you for your order. Here's your invoice:
     🧾 INV-2026-0001
     📅 13-Jul-2026
     • Rasmalai Cake × 1 — ₹1200.00
     ✅ Total: ₹1200.00
     Invoice by: Employee 1
     ```

### Use Case 4: Admin Audit Log Review
1. **Admin Login:** The bakery owner logs in using Google, selects "Admin", and types the admin password.
2. **Full Analytics:** The Admin Dashboard loads, showing sensitive financial details: Monthly Revenue (₹42,500), average profit margins, and recent transactions.
3. **Security Check:** The Admin goes to the **Audit Log** page. They see a complete, chronological history of actions:
   * `LOGIN` (Employee 1, 10:45 AM)
   * `UPDATE_STOCK` (Employee 1, whipped cream, 10:48 AM)
   * `SCAN_INVOICE` (Employee 1, 2 items detected, 10:50 AM)
   * `CREATE_SALE` (Employee 1, INV-2026-0001, Karan, 10:53 AM)
   This logs exact employee accountability for all business operations.
