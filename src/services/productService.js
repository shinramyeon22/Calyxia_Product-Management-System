import { supabase } from './supabaseClient';

// =====================================================
// HOPE PMS - PRODUCT SERVICE (Matches Project Guide Exactly)
// Uses prodcode as primary identifier
// =====================================================

export const getProducts = async (userType = 'USER') => {
  try {
    let query = supabase
      .from('product')
      .select('prodcode, description, unit, stock, price, record_status, stamp, image_url')
      .order('prodcode', { ascending: true });

    // USER only sees ACTIVE records (per spec)
    if (userType.toUpperCase() === 'USER') {
      query = query.eq('record_status', 'A');
    }
    // ADMIN / SUPERADMIN see all (RLS also enforces this)

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/** PostgreSQL duplicate key → readable message */
function throwIfDuplicateProductKey(pgError, prodcodeHint = '') {
  if (!pgError || pgError.code !== '23505') return false;
  const msg = typeof pgError.message === 'string' ? pgError.message : '';
  const detail = typeof pgError.details === 'string' ? pgError.details : '';
  if (/pricehist/i.test(detail) || /pricehist/i.test(msg)) {
    const e = new Error(
      'A price entry for today already exists for this asset code. Adjust it under Price History, or temporarily clear the Price field here and save the row first.'
    );
    e.cause = pgError;
    throw e;
  }
  const fromDetail = detail.match(/=\(([^)]+)\)/)?.[1]?.trim() ?? '';
  const fromMsg = msg.match(/\(\s*([^)]+?)\s*\)\s*already\s+exists/i)?.[1]?.trim() ?? '';
  const code = prodcodeHint?.trim?.() || fromDetail || fromMsg;

  throw Object.assign(
    new Error(
      code
        ? `Asset code "${code}" already exists — each code must be unique. If this asset was soft-deleted, recover it under Deleted Items or choose a different 6-character code.`
        : 'This asset code already exists — each code must be unique. Soft-deleted assets still keep their code; recover them or choose a different code.'
    ),
    { cause: pgError }
  );
}

function isRlsDenied(error) {
  if (!error) return false;
  const msg = String(error.message || '').toLowerCase();
  const details = String(error.details || '').toLowerCase();
  return (
    error.code === '42501' ||
    msg.includes('violates row-level security policy') ||
    details.includes('row-level security')
  );
}

export const isProdcodeAvailable = async (prodcode) => {
  const { data, error } = await supabase
    .from('product')
    .select('prodcode')
    .eq('prodcode', prodcode)
    .maybeSingle();
  if (error) throw error;
  return data == null;
};

export const addProduct = async (productData, userId) => {
  try {
    const stamp = new Date().toISOString();
    const prodcode = productData.prodcode;
    const imageUrl = typeof productData.image_url === 'string' ? productData.image_url.trim() : '';
    const image_url = imageUrl || null;
    const stock = Number.isFinite(Number(productData.stock)) ? Math.max(0, Number(productData.stock)) : 0;
    const price = Number.isFinite(Number(productData.price)) ? Number(productData.price) : null;

    const taken = prodcode ? !(await isProdcodeAvailable(prodcode)) : true;
    if (taken) {
      throw new Error(
        'This product code is already used. Pick a different code (including ones not used by inactive assets).'
      );
    }

    const { data, error } = await supabase.from('product').insert([{
      prodcode,
      description: productData.description,
      unit: productData.unit || 'ea',
      stock,
      price,
      record_status: 'A',
      stamp,
      image_url
    }]).select().single();

    if (error) {
      throwIfDuplicateProductKey(error, prodcode);
      throw error;
    }

    // Keep price history in sync when a base price is entered during asset creation.
    if (price != null) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const { error: insertErr } = await supabase.from('pricehist').insert([{
        prodcode,
        effdate: dateStr,
        unitprice: price,
        stamp
      }]);

      if (insertErr?.code === '23505') {
        const { error: upErr } = await supabase
          .from('pricehist')
          .update({ unitprice: price, stamp })
          .eq('prodcode', prodcode)
          .eq('effdate', dateStr);
        if (upErr && !isRlsDenied(upErr)) throw upErr;
      } else if (insertErr) {
        // Some roles can create products but cannot write price history (RLS).
        // Don't fail asset creation in that case; price can be added later by authorized users.
        if (isRlsDenied(insertErr)) {
          console.warn('Price history insert blocked by RLS during product create:', insertErr);
          return data;
        }
        await supabase.from('product').delete().eq('prodcode', prodcode);
        throw insertErr;
      }
    }

    return data;
  } catch (error) {
    console.error('Error adding product:', error);
    throwIfDuplicateProductKey(error, productData.prodcode);
    throw error;
  }
};

export const updateProduct = async (prodcode, productData, userId) => {
  try {
    const stamp = new Date().toISOString();
    const imageUrl = typeof productData.image_url === 'string' ? productData.image_url.trim() : '';
    const image_url = imageUrl || null;
    const stock = Number.isFinite(Number(productData.stock)) ? Math.max(0, Number(productData.stock)) : 0;
    const price = Number.isFinite(Number(productData.price)) ? Number(productData.price) : null;

    const { data, error } = await supabase.from('product').update({
      description: productData.description,
      unit: productData.unit,
      stock,
      price,
      stamp,
      image_url
    }).eq('prodcode', prodcode).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const softDeleteProduct = async (prodcode, userId) => {
  try {
    const stamp = new Date().toISOString();

    const { data, error } = await supabase.from('product').update({
      record_status: 'I',
      stamp
    }).eq('prodcode', prodcode).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error soft deleting product:', error);
    throw error;
  }
};

export const recoverProduct = async (prodcode, userId) => {
  try {
    const stamp = new Date().toISOString();

    const { data, error } = await supabase.from('product').update({
      record_status: 'A',
      stamp
    }).eq('prodcode', prodcode).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recovering product:', error);
    throw error;
  }
};

// Price History
export const getPriceHistory = async (prodcode) => {
  try {
    const { data, error } = await supabase
      .from('pricehist')
      .select('*')
      .eq('prodcode', prodcode)
      .order('effdate', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
};

export const addPriceEntry = async (prodcode, effDate, unitPrice, userId) => {
  try {
    const stamp = new Date().toISOString();
    
    const { data, error } = await supabase.from('pricehist').insert([{
      prodcode: prodcode,
      effdate: effDate,
      unitprice: parseFloat(unitPrice),
      stamp
    }]).select().single();

    if (error) {
      if (isRlsDenied(error)) {
        throw new Error(
          'You do not have permission to add price history (RLS policy). Ask an admin to grant insert access on pricehist.'
        );
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error('Error adding price entry:', error);
    throw error;
  }
};

/**
 * Latest unit price from `current_product_price` view when present; otherwise newest `pricehist` row.
 * Returns null when no pricing exists (callers merge with optional `product.price`).
 */
export const getCurrentPrice = async (prodcode) => {
  if (!prodcode) return null;

  try {
    const { data: viewRow, error: viewErr } = await supabase
      .from('current_product_price')
      .select('current_price')
      .eq('prodcode', prodcode)
      .maybeSingle();

    if (!viewErr && viewRow?.current_price != null) {
      return Number(viewRow.current_price);
    }
  } catch {
    /* view may not exist in Supabase */
  }

  const { data: rows, error: histErr } = await supabase
    .from('pricehist')
    .select('unitprice')
    .eq('prodcode', prodcode)
    .order('effdate', { ascending: false })
    .limit(1);

  if (!histErr && rows?.[0]?.unitprice != null) {
    return Number(rows[0].unitprice);
  }

  return null;
};

/** Adds `price` from price history / view (fallback to existing row `price`). */
export const enrichProductsWithCurrentPrice = async (products) => {
  if (!Array.isArray(products) || products.length === 0) return [];
  const withPrices = await Promise.all(
    products.map(async (p) => {
      const resolved = await getCurrentPrice(p.prodcode);
      return { ...p, price: resolved ?? p.price ?? 0 };
    })
  );
  return withPrices;
};

// Acquire / Stock (optional for now)
export const acquireProduct = async (prodcode) => {
  try {
    const { data: prod } = await supabase
      .from('product')
      .select('record_status, stock')
      .eq('prodcode', prodcode)
      .single();

    if (!prod || prod.record_status !== 'A') {
      throw new Error('Product not available');
    }

    return { success: true, newStock: prod?.stock ?? 0 };
  } catch (error) {
    console.error('Error acquiring product:', error);
    throw error;
  }
};

// Get current stock for a product (used in ProductDetails)
export const getProductStock = async (prodcode) => {
  try {
    const { data } = await supabase
      .from('product')
      .select('stock')
      .eq('prodcode', prodcode)
      .single();

    return Number.isFinite(Number(data?.stock)) ? Number(data.stock) : 0;
  } catch {
    return 0;
  }
};