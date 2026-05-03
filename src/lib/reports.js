import { supabase } from './supabaseClient'; // Adjust path to your client

export const fetchProductPrices = async () => {
  const { data, error } = await supabase
    .from('current_product_price')
    .select('*');
  if (error) throw error;
  return data;
};

export const fetchTopSellers = async () => {
  const { data, error } = await supabase
    .from('top_selling_products')
    .select('*');
  if (error) throw error;
  return data;
};