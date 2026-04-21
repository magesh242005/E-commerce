// ============================================================
//  DRAPE — Supabase Database Layer (db.js)
//  FIXED: RLS-safe inserts, guest order support, error handling
//  FIXED: Correct Supabase CDN client initialisation
// ============================================================

// The @supabase/supabase-js CDN bundle exposes the library as
// window.supabase  →  window.supabase.createClient(url, key)
// Guard against both the CDN shape and any bundled shape.
const _supabaseLib = (typeof supabase !== 'undefined') ? supabase : window.supabase;
const _createClient = _supabaseLib.createClient || (_supabaseLib.default && _supabaseLib.default.createClient);
if (!_createClient) {
  console.error('[DRAPE] Supabase SDK not loaded — check the CDN <script> tag in index.html.');
}
const db = _createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
//  AUTH
// ============================================================
const Auth = {
  async signUp(email, password, fullName) {
    const { data, error } = await db.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });
    return { data, error };
  },

  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    return { data, error };
  },

  async signOut() {
    const { error } = await db.auth.signOut();
    return { error };
  },

  async getUser() {
    try {
      const { data: { user } } = await db.auth.getUser();
      return user;
    } catch (e) {
      return null;
    }
  },

  onAuthStateChange(callback) {
    return db.auth.onAuthStateChange(callback);
  },

  async forgotPassword(email) {
    // redirectTo must match an allowed URL in Supabase → Auth → URL Configuration
    const { data, error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname + '?reset=1'
    });
    return { data, error };
  },

  async updatePassword(newPassword) {
    const { data, error } = await db.auth.updateUser({ password: newPassword });
    return { data, error };
  }
};

// ============================================================
//  PRODUCTS
// ============================================================
const Products = {
  async getAll() {
    const { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getFeatured() {
    const { data, error } = await db.from('products').select('*').eq('is_featured', true).limit(8);
    if (error) throw error;
    return data || [];
  },

  async getById(id) {
    const { data, error } = await db.from('products').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async getByCategory(category) {
    const { data, error } = await db.from('products').select('*').eq('category', category);
    if (error) throw error;
    return data || [];
  },

  async search(query) {
    const { data, error } = await db.from('products').select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`);
    if (error) throw error;
    return data || [];
  }
};

// ============================================================
//  ORDERS
//  FIX: guest orders (user_id = null) need a permissive policy.
//  Run this in Supabase SQL editor if orders aren't saving:
//
//    -- Allow anyone (including guests) to insert orders
//    drop policy if exists "Users can manage own orders" on orders;
//    create policy "Users can insert orders" on orders
//      for insert with check (true);
//    create policy "Users can view own orders" on orders
//      for select using (auth.uid() = user_id);
//    create policy "Users can update own orders" on orders
//      for update using (auth.uid() = user_id);
// ============================================================
const Orders = {
  async create(orderData) {
    const user = await Auth.getUser();
    const insertPayload = {
      ...orderData,
      user_id: user ? user.id : null
    };
    const { data, error } = await db.from('orders').insert(insertPayload).select().single();
    if (!error) return data;

    // Backward compatibility for older schemas before the SQL patch is run.
    if (/column .* does not exist/i.test(error.message || '')) {
      const fallbackPayload = {
        items: insertPayload.items,
        total: insertPayload.total,
        shipping_details: insertPayload.shipping_details,
        payment_method: insertPayload.payment_method,
        payment_id: insertPayload.payment_id || null,
        razorpay_order_id: insertPayload.razorpay_order_id || null,
        status: insertPayload.status,
        user_id: insertPayload.user_id
      };
      const fallback = await db.from('orders').insert(fallbackPayload).select().single();
      if (fallback.error) throw fallback.error;
      return fallback.data;
    }

    throw error;
  },

  async getByUser() {
    const user = await Auth.getUser();
    if (!user) return [];
    const { data, error } = await db.from('orders').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateStatus(orderId, status, paymentId) {
    const { data, error } = await db.from('orders').update({
      status, payment_id: paymentId
    }).eq('id', orderId).select().single();
    if (error) throw error;
    return data;
  }
};

// ============================================================
//  WISHLIST
// ============================================================
const Wishlist = {
  async add(productId) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Please sign in to save to wishlist');
    const { data, error } = await db.from('wishlists').insert({
      user_id: user.id, product_id: productId
    }).select().single();
    if (error) throw error;
    return data;
  },

  async remove(productId) {
    const user = await Auth.getUser();
    if (!user) throw new Error('Please sign in');
    const { error } = await db.from('wishlists')
      .delete().eq('user_id', user.id).eq('product_id', productId);
    if (error) throw error;
  },

  async getAll() {
    const user = await Auth.getUser();
    if (!user) return [];
    const { data, error } = await db.from('wishlists')
      .select('*, products(*)').eq('user_id', user.id);
    if (error) throw error;
    return data || [];
  },

  async check(productId) {
    const user = await Auth.getUser();
    if (!user) return false;
    const { data } = await db.from('wishlists')
      .select('id').eq('user_id', user.id).eq('product_id', productId).single();
    return !!data;
  }
};

// ============================================================
//  NEWSLETTER
//  FIX: Added upsert fallback to avoid 23505 duplicate errors
// ============================================================
const Newsletter = {
  async subscribe(email) {
    // Try insert first; handle duplicate gracefully
    const { data, error } = await db.from('newsletter_subscribers').insert({ email }).select().single();
    if (error) {
      if (error.code === '23505') throw new Error('You are already subscribed!');
      throw error;
    }
    return data;
  }
};
