# DRAPE — E-Commerce Website

## 🚀 Quick Setup (Database Fix)

Your Supabase credentials are already configured in `config.js`. Follow these steps to fix the database:

---

### Step 1: Run the SQL Fix in Supabase

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **E-commerce** (`ycdtgarhnhoiruocqezu`)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**
5. Open the file `SUPABASE_FIX.sql` (included in this project)
6. Paste the entire contents into the SQL editor
7. Click **Run**

That's it! The script will:
- ✅ Create all required tables (`products`, `orders`, `wishlists`, `newsletter_subscribers`)
- ✅ Set up correct Row Level Security (RLS) policies
- ✅ Fix the guest order bug (orders were failing because of a null `user_id` policy)
- ✅ Insert 16 sample products if your products table is empty

---

### Step 2: Open the Website

Simply open `index.html` in your browser (or deploy to any static host like Netlify/Vercel).

---

## What Was Fixed

### Bug 1: Orders not saving (main issue)
The `orders` table had an RLS policy that required `auth.uid() = user_id`. But guest checkouts save `user_id = null`, which caused the insert to fail silently. 

**Fix:** The SQL script replaces the old policy with `for insert with check (true)` so both guest and logged-in orders save correctly.

### Bug 2: Auth.getUser() errors crashing the page
If Supabase had a session error, `getUser()` would throw and break the whole app.

**Fix:** `db.js` now wraps `getUser()` in a try/catch and returns `null` safely.

---

## File Structure

```
drape_fixed/
├── index.html       — Main HTML (all pages)
├── config.js        — Supabase & Razorpay credentials
├── db.js            — Database layer (FIXED)
├── app.js           — Main application logic
├── features.js      — Features (loyalty, promo codes, etc.)
├── style.css        — Styles
├── SUPABASE_FIX.sql — Run this in Supabase SQL Editor ← IMPORTANT
└── README.md        — This file
```

---

## Supabase Project Details

| Setting | Value |
|---|---|
| Project Name | E-commerce |
| Project ID | ycdtgarhnhoiruocqezu |
| Project URL | https://ycdtgarhnhoiruocqezu.supabase.co |

