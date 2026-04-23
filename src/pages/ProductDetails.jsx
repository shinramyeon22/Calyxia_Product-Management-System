import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      try {
        // 1. Attempt to fetch the single product by its UUID
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('id', id)
          .single();

        if (error || !data) {
          console.error("Product fetch error:", error);
          setProduct(null);
        } else {
          setProduct(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);

  // State 1: Still Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  // State 2: Product Not Found (handles random URLs like /product/abcd)
  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="max-w-7xl mx-auto p-8 flex flex-col items-center justify-center h-[calc(100vh-200px)]">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-400 mb-8 text-center">
            The item you are looking for doesn't exist or the ID is invalid.
          </p>
          <button 
            onClick={() => navigate('/products')}
            className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl font-bold transition"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  // State 3: Success! Show the Product
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-8">
        <button 
          onClick={() => navigate('/products')}
          className="text-gray-400 hover:text-white mb-8 flex items-center gap-2 transition"
        >
          ← Back to Catalog
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-[#0f0f12] border border-[#1f1f23] rounded-3xl p-8">
          {/* Image Section */}
          <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-[#1f1f23]">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                No Image Available
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="flex flex-col">
            <h1 className="text-5xl font-bold mb-4">{product.name}</h1>
            <p className="text-purple-400 text-3xl font-bold mb-6">${product.price}</p>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-gray-500 uppercase text-xs font-bold tracking-widest mb-2">Description</h3>
                <p className="text-gray-300 leading-relaxed text-lg">
                  {product.description || "No description available for this item."}
                </p>
              </div>

              <div className="pt-6 border-t border-[#1f1f23]">
                <div className="flex items-center gap-2 mb-8">
                  <div className={`h-3 w-3 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm font-medium">
                    {product.stock_quantity > 0 ? `${product.stock_quantity} units in stock` : 'Out of Stock'}
                  </span>
                </div>

                <button 
                  disabled={product.stock_quantity <= 0}
                  className="w-full bg-white text-black py-4 rounded-2xl font-bold text-lg hover:bg-purple-500 hover:text-white disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                >
                  {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}