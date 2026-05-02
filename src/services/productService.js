import { supabase } from './supabaseClient';

// =====================================================
// HOPE PMS - PRODUCT SERVICE (Matches Project Guide Exactly)
// Uses prodcode as primary identifier
// =====================================================

export const getProducts = async (userType = 'USER') => {
  try {
    let query = supabase
      .from('product')
      .select('prodcode, description, unit, record_status, stamp')
      .order('prodcode', { ascending: true });

    // USER only sees ACTIVE records (per spec)
    if (userType.toUpperCase() === 'USER') {
      query = query.eq('record_status', 'ACTIVE');
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

export const addProduct = async (productData, userId) => {
  try {
    const stamp = `ADDED ${userId || 'system'} ${new Date().toISOString().slice(0, 16)}`;
    
    const { data, error } = await supabase.from('product').insert([{
      prodcode: productData.prodcode,
      description: productData.description,
      unit: productData.unit || 'ea',
      record_status: 'ACTIVE',
      stamp
    }]).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (prodcode, productData, userId) => {
  try {
    const stamp = `EDITED ${userId || 'system'} ${new Date().toISOString().slice(0, 16)}`;
    
    const { data, error } = await supabase.from('product').update({
      description: productData.description,
      unit: productData.unit,
      stamp
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
    const stamp = `DEACTIVATED ${userId} ${new Date().toISOString().slice(0, 16)}`;
    
    const { data, error } = await supabase.from('product').update({
      record_status: 'INACTIVE',
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
    const stamp = `REACTIVATED ${userId} ${new Date().toISOString().slice(0, 16)}`;
    
    const { data, error } = await supabase.from('product').update({
      record_status: 'ACTIVE',
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
    const stamp = `PRICE UPDATE ${userId} ${new Date().toISOString().slice(0, 16)}`;
    
    const { data, error } = await supabase.from('pricehist').insert([{
      prodcode: prodcode,
      effdate: effDate,
      unitprice: parseFloat(unitPrice),
      stamp
    }]).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding price entry:', error);
    throw error;
  }
};

export const getCurrentPrice = async (prodcode) => {
  try {
    // Use the view from your existing DB
    const { data } = await supabase
      .from('current_product_price')
      .select('current_price')
      .eq('prodcode', prodcode)
      .single();

    return data?.current_price || 0;
  } catch {
    return 0;
  }
};

// Acquire / Stock (optional for now)
export const acquireProduct = async (prodcode) => {
  try {
    const { data: prod } = await supabase
      .from('product')
      .select('record_status')
      .eq('prodcode', prodcode)
      .single();

    if (!prod || prod.record_status !== 'ACTIVE') {
      throw new Error('Product not available');
    }

    // In real system this would also insert into sales/salesDetail
    return { success: true };
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
      .select('record_status')
      .eq('prodcode', prodcode)
      .single();

    // For now we return a mock stock since stock column may not exist yet
    // In full implementation, add a 'stock' column to product table
    return data?.record_status === 'ACTIVE' ? 10 : 0;
  } catch {
    return 0;
  }
};