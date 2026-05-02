import { supabase } from '../supabaseClient';

export const getProducts = async (userType = 'USER') => {
  try {
    let query = supabase
      .from('product')
      .select('*')
      .order('id', { ascending: true });

    if (userType.toUpperCase() === 'USER') {
      query = query.eq('record_status', 'A');
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const addProduct = async (productData) => {
  try {
    const { data, error } = await supabase.from('product').insert([{
      name: productData.name || 'New Product',
      description: productData.description,
      unit: productData.unit || 'ea',
      record_status: 'A',
      created_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

export const updateProduct = async (id, productData) => {
  try {
    const { data, error } = await supabase.from('product').update({
      name: productData.name,
      description: productData.description,
      unit: productData.unit,
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const softDeleteProduct = async (id) => {
  try {
    const { data, error } = await supabase.from('product').update({
      record_status: 'I',
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error soft deleting product:', error);
    throw error;
  }
};

export const recoverProduct = async (id) => {
  try {
    const { data, error } = await supabase.from('product').update({
      record_status: 'A',
      updated_at: new Date().toISOString()
    }).eq('id', id).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error recovering product:', error);
    throw error;
  }
};

export const getPriceHistory = async (productId) => {
  try {
    const { data, error } = await supabase
      .from('priceHist')
      .select('*')
      .eq('product_id', productId)   // Make sure this column name matches your priceHist table
      .order('effDate', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching price history:', error);
    throw error;
  }
};

export const addPriceEntry = async (productId, effDate, unitPrice) => {
  try {
    const { data, error } = await supabase.from('priceHist').insert([{
      product_id: productId,
      effDate,
      unitPrice: parseFloat(unitPrice),
      record_status: 'A',
      created_at: new Date().toISOString()
    }]).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding price entry:', error);
    throw error;
  }
};

export const getCurrentPrice = async (productId) => {
  try {
    const { data } = await supabase
      .from('priceHist')
      .select('unitPrice')
      .eq('product_id', productId)
      .order('effDate', { ascending: false })
      .limit(1)
      .single();

    return data?.unitPrice || 0;
  } catch {
    return 0;
  }
};