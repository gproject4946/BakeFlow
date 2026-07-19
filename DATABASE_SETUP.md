# BakeFlow — Database Setup Guide

## Step 1: Create a Free Neon PostgreSQL Database

1. Go to [https://console.neon.tech](https://console.neon.tech) and sign up (free)
2. Click **"New Project"** → name it `bakeflow`
3. Copy the **Connection string** — it looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-frog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Update Your `.env` File

Open `backend/.env` and replace the `DATABASE_URL` line:

```env
# Replace the placeholder with your actual Neon connection string
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-HOST.neon.tech/neondb?sslmode=require
```

## Step 3: Push the Schema to the Database

Run this once to create all tables:

```bash
cd backend
npx prisma db push
```

You should see output like:
```
✅ Your database is now in sync with your Prisma schema.
```

## Step 4: Start the Server

```bash
npm start
# or for development with hot-reload:
npm run dev
```

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `P1010: User was denied access` | Wrong credentials in DATABASE_URL |
| `P1001: Can't reach database server` | Check your Neon project is active, or your internet connection |
| `PrismaClientInitializationError` | Missing DATABASE_URL in .env |

## What was migrated

| Old (Google Sheets) | New (PostgreSQL / Neon) |
|---|---|
| `sheetsClient.getAll('Ingredients')` | `prisma.ingredient.findMany({ where: { tenantId } })` |
| Row-number based updates (`_rowIndex`) | UUID-based updates (`id`) |
| Sequential invoice numbers (race condition) | PostgreSQL sequence (atomic, concurrent-safe) |
| Browser-computed stock (race condition) | Atomic `{ decrement: amount }` / `{ increment: amount }` |
| Single-tenant flat sheets | Multi-tenant shared schema (ready for SaaS) |
