import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase.from('product').select('*').eq('id', id).single();
      setProduct(data);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#050505]" />;

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
          <span className="text-[#d4af37] text-xs tracking-widest">INSTITUTIONAL ASSET</span>
          <h1 className="serif-font text-6xl md:text-7xl italic mt-6 leading-none">{product.name}</h1>
          <div className="text-5xl text-[#d4af37] mt-10 mb-12">₱{product.price.toLocaleString()}</div>
          
          <p className="text-white/70 text-lg leading-relaxed">{product.description}</p>

          <button className="mt-16 w-full py-6 border border-[#d4af37] text-[#d4af37] text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition">
            ACQUIRE THIS PIECE
          </button>
        </div>
      </div>
    </div>
  );
}