import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
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
    <div className="calyxia-boutique-env min-h-screen bg-[#050505] text-white">
      <Navbar />

      <header className="pt-32 pb-20 text-center border-b border-white/10">
        <span className="text-[#d4af37] text-xs tracking-[0.5em] uppercase">The Private Collection</span>
        <h1 className="serif-font text-7xl md:text-8xl italic mt-6 tracking-tighter">Calyxia Collections</h1>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="text-[#d4af37] text-xs tracking-[0.5em]">CURATING ASSETS...</div>
          </div>
        ) : (
          products.map((p, index) => (
            <section key={p.id} className={`flex flex-col lg:flex-row gap-16 mb-32 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className="lg:w-3/5 bg-black border border-white/10 p-8">
                <img 
                  src={p.image_url || 'https://via.placeholder.com/1200x800/111/ddd?text=Calyxia+Asset'} 
                  alt={p.name} 
                  className="w-full h-auto object-contain"
                />
              </div>

              <div className="lg:w-2/5 flex flex-col justify-center">
                <span className="text-xs tracking-widest text-white/50">SELECTION NO. 0{index + 1}</span>
                <h2 className="serif-font text-5xl md:text-6xl italic mt-6 mb-8 leading-none">{p.name}</h2>
                <p className="text-white/70 leading-relaxed mb-10">{p.description}</p>
                
                <div className="text-4xl text-[#d4af37] mb-12">₱{p.price.toLocaleString()}</div>

                <Link 
                  to={`/product/${p.id}`} 
                  className="inline-block border border-[#d4af37] text-[#d4af37] px-12 py-5 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all"
                >
                  EXPLORE PIECE
                </Link>
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}