/* =============================================================
   DATA LAYER · Supabase-backed (fp_ prefixed tables)
   Cart, favs, customer stay in localStorage (per-user data)
   ============================================================= */

const STORAGE_KEYS = {
  cart: 'fpa.cart',
  favs: 'fpa.favs',
  customer: 'fpa.customer',
  admin: 'fpa.admin.session'
};

// -- Supabase helpers: map DB row <-> app object --

function dbToProduct(r) {
  return {
    id: r.id, name: r.name, brand: r.brand, family: r.family || '',
    notes: { top: r.notes_top || '', heart: r.notes_heart || '', base: r.notes_base || '' },
    price: parseFloat(r.price), oldPrice: r.old_price ? parseFloat(r.old_price) : null,
    rating: parseFloat(r.rating), reviews: r.reviews, stock: r.stock,
    kind: r.kind, preorderDays: r.preorder_days, depositPct: r.deposit_pct,
    tags: r.tags || [], description: r.description || '',
    color: r.color || '#4B2E24', accent: r.accent || '#C8A96B',
    imageUrl: r.image_url || null
  };
}

function productToDb(p) {
  return {
    id: p.id, name: p.name, brand: p.brand, family: p.family,
    notes_top: p.notes.top, notes_heart: p.notes.heart, notes_base: p.notes.base,
    price: p.price, old_price: p.oldPrice,
    rating: p.rating, reviews: p.reviews, stock: p.stock,
    kind: p.kind, preorder_days: p.preorderDays, deposit_pct: p.depositPct,
    tags: p.tags, description: p.description,
    color: p.color, accent: p.accent,
    image_url: p.imageUrl || null
  };
}

function dbToOrder(r) {
  return {
    id: r.id, customer: r.customer, phone: r.phone, city: r.city || '',
    items: r.items, total: parseFloat(r.total), paid: parseFloat(r.paid),
    kind: r.kind, status: r.status, createdAt: r.created_at
  };
}

function orderToDb(o) {
  return {
    id: o.id, customer: o.customer, phone: o.phone, city: o.city,
    items: o.items, total: o.total, paid: o.paid,
    kind: o.kind, status: o.status, created_at: o.createdAt
  };
}

function dbToPromo(r) {
  return {
    id: r.id, code: r.code, title: r.title, description: r.description || '',
    discountPct: r.discount_pct, freeShipping: r.free_shipping,
    active: r.active, validUntil: r.valid_until, appliesTo: r.applies_to || 'all'
  };
}

function promoToDb(p) {
  return {
    id: p.id, code: p.code, title: p.title, description: p.description,
    discount_pct: p.discountPct, free_shipping: p.freeShipping,
    active: p.active, valid_until: p.validUntil, applies_to: p.appliesTo || 'all'
  };
}

// -- DataStore (async for Supabase, sync for localStorage) --

const DataStore = {
  // --- Products (Supabase) ---
  async products() {
    const { data, error } = await sb.from('fp_products').select('*').order('created_at');
    if (error) { console.error('fp_products fetch:', error); return []; }
    return data.map(dbToProduct);
  },
  async saveProduct(p) {
    const row = productToDb(p);
    const { error } = await sb.from('fp_products').upsert(row, { onConflict: 'id' });
    if (error) console.error('fp_products upsert:', error);
  },
  async deleteProduct(id) {
    const { error } = await sb.from('fp_products').delete().eq('id', id);
    if (error) console.error('fp_products delete:', error);
  },

  // --- Orders (Supabase) ---
  async orders() {
    const { data, error } = await sb.from('fp_orders').select('*').order('created_at', { ascending: false });
    if (error) { console.error('fp_orders fetch:', error); return []; }
    return data.map(dbToOrder);
  },
  async saveOrder(o) {
    const row = orderToDb(o);
    const { error } = await sb.from('fp_orders').upsert(row, { onConflict: 'id' });
    if (error) console.error('fp_orders upsert:', error);
  },
  async updateOrderStatus(id, status) {
    const { error } = await sb.from('fp_orders').update({ status }).eq('id', id);
    if (error) console.error('fp_orders update:', error);
  },

  // --- Promos (Supabase) ---
  async promos() {
    const { data, error } = await sb.from('fp_promos').select('*').order('created_at');
    if (error) { console.error('fp_promos fetch:', error); return []; }
    return data.map(dbToPromo);
  },
  async savePromo(p) {
    const row = promoToDb(p);
    const { error } = await sb.from('fp_promos').upsert(row, { onConflict: 'id' });
    if (error) console.error('fp_promos upsert:', error);
  },
  async deletePromo(id) {
    const { error } = await sb.from('fp_promos').delete().eq('id', id);
    if (error) console.error('fp_promos delete:', error);
  },
  async setPromoActive(id, active) {
    if (active) {
      // desativa todas antes de ativar a selecionada
      await sb.from('fp_promos').update({ active: false }).neq('id', id);
    }
    const { error } = await sb.from('fp_promos').update({ active }).eq('id', id);
    if (error) console.error('fp_promos toggle:', error);
  },

  // --- Image Upload (Supabase Storage) ---
  async uploadImage(file, productId) {
    const ext = file.name.split('.').pop();
    const path = `fernanda/${productId}.${ext}`;
    const { data, error } = await sb.storage
      .from('product-images')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { console.error('upload:', error); return null; }
    const { data: urlData } = sb.storage
      .from('product-images')
      .getPublicUrl(path);
    return urlData.publicUrl;
  },

  // --- Cart (localStorage) ---
  cart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]'); } catch (_) { return []; }
  },
  saveCart(c) { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(c)); },

  // --- Favs (localStorage) ---
  favs() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.favs) || '[]'); } catch (_) { return []; }
  },
  saveFavs(f) { localStorage.setItem(STORAGE_KEYS.favs, JSON.stringify(f)); },

  // --- Customer (localStorage) ---
  customer() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.customer) || 'null'); } catch (_) { return null; }
  },
  saveCustomer(c) { localStorage.setItem(STORAGE_KEYS.customer, JSON.stringify(c)); },

  // --- Admin auth (Supabase RPC) ---
  async verifyAdmin(password) {
    const { data, error } = await sb.rpc('fp_verify_admin_password', { pwd: password });
    if (error) { console.error('admin verify:', error); return false; }
    return data === true;
  }
};

// --- Utility functions (kept from original) ---

const BRL = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function formatPhone(raw) {
  const d = (raw || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}
function isValidPhone(value) {
  return (value || '').replace(/\D/g, '').length >= 10;
}
function isValidName(value) {
  const parts = (value || '').trim().split(/\s+/);
  return parts.length >= 2 && parts.every(p => p.length >= 2);
}
