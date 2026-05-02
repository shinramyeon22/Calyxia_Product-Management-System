import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; // Added for Admin check
import Navbar from '../components/Navbar';
import { useRights } from '../context/UserRightsContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth(); 
  const [product, setProduct] = useState(null);
  
  // 1. DATA LOADING (Keep this name)
  const [loading, setLoading] = useState(true); 
  
  // 2. RIGHTS LOADING (Rename 'loading' to 'rightsLoading' here)
  const { hasRight, loading: rightsLoading } = useRights();

  // PR-02: Derived Admin check for Stamp visibility
  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdminOrSuper = userType === 'ADMIN' || userType === 'SUPERADMIN';

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from('product')
        .select('*')
        .eq('id', id)
        .single();
      
      setProduct(data);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  // PR-02: Professional unified loading state
  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
         <p className="text-[#d4af37] text-xs tracking-widest animate-pulse">
            AUTHENTICATING ACCESS...
         </p>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl serif-font">Asset Not Found</h1>
          <Link to="/products" className="mt-8 inline-block text-[#d4af37]">← Return to Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      
      <nav className="px-8 py-12">
        <Link to="/products" className="text-xs tracking-widest text-[#d4af37] hover:underline">← BACK TO COLLECTION</Link>
      </nav>

      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-2 gap-16">
        <div className="bg-black border border-white/10 p-12">
          <img src={product.image_url} alt={product.name} className="w-full h-auto" />
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <span className="text-[#d4af37] text-xs tracking-widest">INSTITUTIONAL ASSET</span>
            
            {/* PR-02: Stamp visibility gated to Admin/SuperAdmin */}
            {isAdminOrSuper && (
              <span className="text-white/30 text-[10px] tracking-tighter">
                VAULT ENTRY: {new Date(product.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <h1 className="serif-font text-6xl md:text-7xl italic mt-6 leading-none">{product.name}</h1>
          <div className="text-5xl text-[#d4af37] mt-10 mb-12">₱{product.price ? Number(product.price).toLocaleString() : '0'}</div>
          
          <p className="text-white/70 text-lg leading-relaxed">{product.description}</p>

          {/* PR-02: Example of gating a specific action button */}
          {hasRight('PRD_VIEW') && (
            <button className="mt-16 w-full py-6 border border-[#d4af37] text-[#d4af37] text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition uppercase">
              Acquire This Piece
            </button>
          )}

          {/* PR-02: Added Edit button for Admins only */}
          {hasRight('PRD_EDIT') && (
            <Link 
              to={`/admin/edit/${product.id}`}
              className="mt-4 w-full py-4 bg-white/5 border border-white/10 text-white/50 text-center text-[10px] tracking-[0.3em] hover:text-white transition uppercase"
            >
              Modify Asset Records
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}