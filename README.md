# 🥐 BlissOven Calculator — Setup Guide

A professional bakery cost calculator that stores all your data in **Google Sheets**.

---

## What's New (v2.0)

- ✅ All data stored in **Google Sheets** — never lost, accessible anywhere
- ✅ Real Node.js + Express backend
- ✅ Proper multi-file project structure
- ✅ Add/update/delete ingredients, packaging, products — changes persist forever
- ✅ Save calculations/orders to Google Sheets
- ✅ Audit log of all price changes

---

## Step 1 — Google Cloud Setup (one-time, ~10 minutes)

### 1.1 Create a Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"New Project"** → Name it `BlissOven` → Click **Create**

### 1.2 Enable Google Sheets API
1. In the left menu → **APIs & Services** → **Library**
2. Search for **"Google Sheets API"**
3. Click it → Click **Enable**

### 1.3 Create a Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **Service Account**
3. Name it `blissoven-app` → Click **Create and Continue** → **Done**

### 1.4 Download the JSON Key
1. In the credentials list, click your new service account (`blissoven-app`)
2. Go to the **Keys** tab
3. Click **"Add Key"** → **"Create new key"** → **JSON** → **Create**
4. A `.json` file downloads — **keep this safe, don't share it!**

---

## Step 2 — Create & Share the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a **new blank spreadsheet**
2. Name it `BlissOven Data`
3. **Copy the Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit
   ```
4. Open the downloaded JSON key file. Find the `client_email` field — it looks like:
   ```
   blissoven-app@your-project.iam.gserviceaccount.com
   ```
5. In Google Sheets, click **Share** → paste that email → set role to **Editor** → Share

---

## Step 3 — Configure Your .env File

Go into the `backend` folder and copy the example file:
```bash
cd backend
cp .env.example .env
```

Open `backend/.env` in a text editor and fill in:

```env
SPREADSHEET_ID=paste_your_spreadsheet_id_here
GOOGLE_CREDENTIALS=paste_entire_json_key_file_content_here
PORT=3000
```

**For `GOOGLE_CREDENTIALS`**: Open the downloaded JSON key file, copy ALL the content, and paste it as a single line. It should look like:
```
GOOGLE_CREDENTIALS={"type":"service_account","project_id":"blissoven","private_key_id":"abc123",...}
```

---

## Step 4 — Install & Run

```bash
# Go into backend:
cd backend

# Install dependencies:
npm install

# Start the server:
npm start
```

You'll see:
```
🥐  BlissOven Calculator — Starting...
🔌  Connecting to Google Sheets...
📋  Seeding default ingredients...
📦  Seeding default packaging...
🛒  Seeding default products...
✅  Google Sheets connected & schema ready!
🚀  Server running → http://localhost:3000
```

Open your browser → **http://localhost:3000** 🎉

---

## Step 5 — First Run

The app will automatically create 6 tabs in your Google Sheet:
- `Ingredients` — all 26 default raw materials
- `Packaging` — all 16 packaging items  
- `Products` — 12 default products
- `Orders` — your saved calculations
- `Settings` — labour & overhead settings
- `AuditLog` — price change history

---

## Running Again Later

Every time you want to use the app:
```bash
cd backend
npm start
```

Then open **http://localhost:3000** in your browser.

---

## Development Mode (auto-restart on code changes)

```bash
cd backend
npm run dev
```

---

## Project Structure

```
BlissOven_Calculator-main/
├── README.md
├── .gitignore
├── demo_backup_index.html  ← Original monolithic backup file
├── frontend/               ← Frontend (HTML, CSS, Client JS)
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── api.js
│       └── app.js
└── backend/                ← Backend Server (Node.js/Express)
    ├── server.js
    ├── package.json
    ├── .env                ← Your credentials (never commit this!)
    ├── .env.example
    ├── sheets/
    │   └── sheetsClient.js
    └── routes/
        ├── ingredients.js
        ├── packaging.js
        ├── products.js
        ├── orders.js
        ├── settings.js
        └── audit.js
```

---

## Troubleshooting

| Error | Solution |
|---|---|
| `SPREADSHEET_ID not set` | Check your `.env` file |
| `GOOGLE_CREDENTIALS not valid JSON` | Make sure the JSON is on one line with no line breaks |
| `Permission denied` | Make sure you shared the sheet with the service account email |
| `Server not starting` | Run `npm install` first |

---

## Backing Up Your Data

Your data is already safe in Google Sheets! But you can also:
- **Export to Excel**: In Google Sheets → File → Download → Excel
- **See all changes**: Check the `AuditLog` tab in your sheet
