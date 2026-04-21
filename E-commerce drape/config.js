// ============================================================
//  DRAPE — Configuration
//  ⚠️ REPLACE THESE VALUES WITH YOUR ACTUAL CREDENTIALS
// ============================================================

// ---- SUPABASE ----
// Go to: https://supabase.com → Your Project → Settings → API
// Replace these with your project's values. SUPABASE_URL should look like:
//   https://<project_ref>.supabase.co
// and SUPABASE_ANON_KEY should be the anon/public or publishable key.
const SUPABASE_URL = 'https://ycdtgarhnhoiruocqezu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pBuOtR4sp_Xmvl1_USYHWA_l_yx0NDf';

// ---- RAZORPAY ----
// Go to: https://dashboard.razorpay.com → Settings → API Keys
// Use TEST keys for development, LIVE keys for production
const RAZORPAY_KEY_ID = 'rzp_test_SeBvfFSWNoFVNQ';

// ---- APP SETTINGS ----
const APP_CONFIG = {
  currency: 'INR',
  currencySymbol: '₹',
  freeShippingThreshold: 999,
  shippingCharge: 99,
  appName: 'DRAPE',
  supportEmail: 'support@drape.in'
};

// ============================================================
//  SUPABASE DATABASE SCHEMA (run in Supabase SQL Editor)
// ============================================================
/*

-- Products Table
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  original_price numeric,
  category text check (category in ('Men', 'Women', 'Kids', 'Accessories')),
  tags text[] default '{}',
  sizes text[] default '{"S","M","L","XL","XXL"}',
  colors jsonb default '[]',
  images text[] default '{}',
  rating numeric default 4.5,
  review_count integer default 0,
  stock integer default 100,
  is_featured boolean default false,
  badge text,
  created_at timestamptz default now()
);

-- Orders Table
create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  items jsonb not null,
  total numeric not null,
  shipping_details jsonb,
  customer_details jsonb,
  pricing_details jsonb,
  payment_method text,
  payment_id text,
  razorpay_order_id text,
  order_source text default 'web_checkout',
  status text default 'pending' check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  created_at timestamptz default now()
);

-- Wishlist Table
create table wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  product_id uuid references products(id) not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Newsletter Table
create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- Row Level Security
alter table products enable row level security;
alter table orders enable row level security;
alter table wishlists enable row level security;
alter table newsletter_subscribers enable row level security;

-- Policies
create policy "Products are viewable by everyone" on products for select using (true);
create policy "Users can manage own orders" on orders for all using (auth.uid() = user_id);
create policy "Users can manage own wishlist" on wishlists for all using (auth.uid() = user_id);
create policy "Anyone can subscribe" on newsletter_subscribers for insert with check (true);

-- Sample Products (run after creating table)
insert into products (name, description, price, original_price, category, tags, images, rating, review_count, is_featured, badge) values
  ('Classic White Oxford Shirt', 'A timeless Oxford shirt crafted from 100% premium cotton. Perfect for both formal and casual occasions.', 1299, 1999, 'Men', '{formal,casual,summer}', '{https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800}', 4.8, 245, true, 'Bestseller'),
  ('Floral Wrap Dress', 'Elegant wrap dress with a beautiful floral print. Flattering silhouette for all body types.', 2499, 3499, 'Women', '{summer,casual}', '{https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800}', 4.7, 189, true, 'New'),
  ('Slim Fit Chinos', 'Modern slim-fit chinos in premium stretch fabric. Available in multiple colors.', 1799, null, 'Men', '{casual,formal}', '{https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800}', 4.6, 312, false, null),
  ('Printed Cotton Kurta', 'Beautiful hand-block printed kurta in soft breathable cotton. Traditional meets modern.', 1599, 2199, 'Women', '{casual,formal,summer}', '{https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800}', 4.9, 156, true, 'Sale'),
  ('Kids Rainbow Tee', 'Soft organic cotton t-shirt with fun rainbow print. Perfect for active kids.', 599, 799, 'Kids', '{casual,summer}', '{https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800}', 4.5, 98, false, null),
  ('Leather Belt', 'Genuine leather belt with brushed gold buckle. A wardrobe essential.', 899, null, 'Accessories', '{formal,casual}', '{https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800}', 4.4, 67, false, null),
  ('Striped Polo Shirt', 'Classic striped polo in premium piqué cotton. Smart casual perfection.', 1199, 1599, 'Men', '{casual,summer}', '{https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800}', 4.6, 203, true, null),
  ('Maxi Floral Skirt', 'Flowy maxi skirt in lightweight chiffon with a vibrant floral pattern.', 1899, 2599, 'Women', '{summer,casual}', '{https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=800}', 4.8, 134, true, 'Trending'),
  ('Denim Jacket', 'Classic denim jacket with a modern fit. Layer over anything for instant style.', 2999, 3999, 'Men', '{casual}', '{https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=800}', 4.7, 421, false, null),
  ('Silk Scarf', 'Luxurious 100% silk scarf with an artistic print. Wear it countless ways.', 1299, null, 'Accessories', '{formal,casual}', '{https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800}', 4.5, 89, false, null),
  ('Kids Denim Dungaree', 'Adorable denim dungaree with adjustable straps and cute embroidery.', 1099, 1499, 'Kids', '{casual}', '{https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800}', 4.6, 112, false, null),
  ('Linen Blazer', 'Lightweight linen blazer perfect for warm-weather formal occasions.', 3499, 4999, 'Men', '{formal,summer}', '{https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800}', 4.8, 78, true, 'New'),
  ('Embroidered Blouse', 'Delicate embroidered blouse in breathable cotton. Pairs with everything.', 1699, 2299, 'Women', '{casual,formal}', '{https://images.unsplash.com/photo-1485462537746-965f33f4f4c2?w=800}', 4.7, 167, false, null),
  ('Canvas Tote Bag', 'Sturdy canvas tote with leather handles. Spacious and stylish.', 799, null, 'Accessories', '{casual}', '{https://images.unsplash.com/photo-1622560480654-d96214fdc887?w=800}', 4.3, 245, false, null),
  ('Kids Floral Dress', 'Sweet floral dress in soft cotton. With smocked detailing and bow.', 899, 1199, 'Kids', '{casual,summer}', '{https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800}', 4.7, 89, false, null),
  ('Wide-Leg Trousers', 'Sophisticated wide-leg trousers in crepe fabric. Elevate any outfit.', 2199, 2999, 'Women', '{formal,casual}', '{https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800}', 4.6, 198, true, null);
*/

// Quick runtime warning to help detect misconfiguration early in the browser console
try {
  const _isValid = typeof SUPABASE_URL === 'string' && /https?:\/\/[^\s]+\.supabase\.co/.test(SUPABASE_URL) && typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY !== 'your-anon-key-here';
  if (!_isValid) console.warn('Supabase appears to be unconfigured or misconfigured. Set SUPABASE_URL and SUPABASE_ANON_KEY in config.js to enable live backend.');
} catch (e) {}
