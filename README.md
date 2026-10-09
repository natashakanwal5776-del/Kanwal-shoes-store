# Kanwal Shoes Store

A modern, high-performance static e-commerce storefront with an intuitive owner admin panel, live bilingual English/Urdu support, WhatsApp ordering, category-aware shoe sizing, and a free cloud database powered by **Supabase**.

---

## Quick Setup Guide (Step by Step)

### Step 1: Run the Database Setup in Supabase
1. Open your [Supabase Dashboard](https://supabase.com/dashboard) and select your project (`xwelwgyudlpfukqwtwwo`).
2. Click on the **SQL Editor** tab on the left sidebar (icon with `>_`).
3. Click **New query**.
4. Open the file [`supabase/schema.sql`](supabase/schema.sql) in this repository, copy all of its contents, and paste them into the SQL editor.
5. Click the green **Run** button (or press `Ctrl + Enter`).
   - This creates the `products` table, `orders` table, Row Level Security (RLS) policies, atomic stock checkout function (`place_order`), restock function (`cancel_order`), the public `product-media` storage bucket, and pre-seeds the initial sample shoes with photos.

---

### Step 2: Create Your Admin Login User
1. In your Supabase dashboard, go to **Authentication** &rarr; **Users** on the left menu.
2. Click **Add user** &rarr; **Create user**.
3. Enter your store email and chosen secure password.
4. Make sure **Auto Confirm User?** is checked (`ON`).
5. Click **Create user**.
   - You can now log into your store admin panel at `/admin` using this email and password!

---

### Step 3: Check Configuration (`js/config.js`)
The file [`js/config.js`](js/config.js) contains your project's public configuration:
```javascript
const SUPABASE_CONFIG = {
  url: "https://xwelwgyudlpfukqwtwwo.supabase.co",
  anonKey: "sb_publishable_moplyXNxhuzaCN_YYzH01A_A5i3I-_1"
};
```
> **Note:** The `anonKey` is public by design for browser clients. You never need environment variables or a server. **Never** put the `service_role` key here.

---

### Step 4: Deploy on Vercel or Netlify (Free)

#### Deploying on Vercel:
1. Log in to [Vercel](https://vercel.com) with your GitHub account.
2. Click **Add New...** &rarr; **Project**.
3. Import your repository: `natashakanwal5776-del/Kanwal-shoes-store`.
4. In Project Settings:
   - **Framework Preset:** `Other` (or static).
   - **Build Command:** Leave empty (none).
   - **Output Directory:** Leave empty / default (`.`).
   - **Environment Variables:** None needed.
5. Click **Deploy**. Your website will be live in 10 seconds!

#### Deploying on Netlify:
1. Log in to [Netlify](https://netlify.com) with GitHub.
2. Click **Add new site** &rarr; **Import an existing project**.
3. Choose GitHub and select `natashakanwal5776-del/Kanwal-shoes-store`.
4. Leave the build command empty, publish directory as `.`.
5. Click **Deploy Site**.

---

### Step 5: Add Keep-Alive Secrets in GitHub
Supabase free projects pause after 7 days without activity. This repository includes a GitHub Action (`.github/workflows/keep-alive.yml`) that pings your database every 3 days.

To activate it:
1. Go to your GitHub repository page: [Kanwal-shoes-store](https://github.com/natashakanwal5776-del/Kanwal-shoes-store).
2. Click **Settings** (top tab) &rarr; **Secrets and variables** &rarr; **Actions**.
3. Click **New repository secret** and add:
   - **Name:** `SUPABASE_URL`
   - **Value:** `https://xwelwgyudlpfukqwtwwo.supabase.co`
4. Click **New repository secret** again and add:
   - **Name:** `SUPABASE_ANON_KEY`
   - **Value:** `sb_publishable_moplyXNxhuzaCN_YYzH01A_A5i3I-_1`
5. That's it! GitHub Actions will keep your Supabase database active automatically.

---

## Managing Your Store (Admin Panel)
Navigate to `/admin` (or `admin.html`):
- **Log In:** Use the email and password you created in Step 2.
- **Add a Shoe:**
  - Name (English & Urdu), Collection (Women, Men, Kids), and Shoe Type.
  - Price & optional Sale Price.
  - Available colours (custom colour picker).
  - Stock per size (EU standard ranges: Women 35-42, Men 39-46, Kids 18-34). Enter 0 for out-of-stock sizes.
  - Photos: Upload multiple pictures from your computer or phone. Photos are automatically compressed in your browser for fast loading. Pick any photo as the main display photo.
  - Video (optional): Upload a short 10-30s video (under 25 MB) or paste any YouTube link.
- **Edit & Delete:** Update any shoe's pricing, photos, or stock anytime. Deleting a shoe removes it and its media files immediately.
- **Hide / Show:** Toggle visibility without deleting.
- **Orders Management:** View customer orders, update order statuses (pending, confirmed, packed, shipped, delivered, cancelled), click to message customers on WhatsApp, and export backups to CSV or JSON. Cancelling an order automatically restores item stock.
