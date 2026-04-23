import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
// 1. CRITICAL: You must import Link to make navigation work
import { Link } from 'react-router-dom'; 

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getProducts() {
      const { data } = await supabase.from('product').select('*');
      setProducts(data || []);
      setLoading(false);
    }
    getProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">Available Tech</h1>
        
        {loading ? (
          <p>Loading catalog...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.id} className="bg-[#0f0f12] border border-[#1f1f23] p-4 rounded-xl hover:border-purple-500 transition group">
                <div className="aspect-square bg-gray-900 rounded-lg mb-4 overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 text-xs text-center p-4">No Image Available</div>
                  )}
                </div>
                <h2 className="text-xl font-bold">{p.name}</h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{p.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-purple-400 font-bold text-lg">${p.price}</span>
                  
                  {/* 2. FIXED: Changed <button> to <Link> and added the 'to' path */}
                  <Link 
                    to={`/product/${p.id}`} 
                    className="bg-white text-black text-xs px-4 py-2 rounded-full font-bold hover:bg-purple-400 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}