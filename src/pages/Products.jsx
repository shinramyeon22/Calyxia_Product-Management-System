import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import { Link } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes((user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase());

  useEffect(() => {
    async function getProducts() {
      const { data } = await supabase
        .from('product')
        .select('*')
        .eq('record_status', 'A')
        .order('id', { ascending: true });
      setProducts(data || []);
      setLoading(false);
    }
    getProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.id?.toString().includes(searchTerm))
  );

  return (
    <div className="calyxia-boutique-env min-h-screen bg-[#050505] text-white">
      <Navbar />

      <header className="pt-32 pb-20 text-center border-b border-white/10">
        <span className="text-[#d4af37] text-xs tracking-[0.5em] uppercase">The Private Collection</span>
        <h1 className="serif-font text-7xl md:text-8xl italic mt-6 tracking-tighter">Calyxia Collections</h1>
        <p className="mt-6 text-white/60 max-w-md mx-auto">Curated institutional assets. Each piece tells a story of craftsmanship and rarity.</p>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20">
        {/* Search */}
        <div className="mb-12 flex justify-end">
          <input 
            type="text" 
            placeholder="SEARCH ASSETS..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs bg-transparent border border-white/20 px-6 py-4 text-sm tracking-widest focus:border-[#d4af37] outline-none placeholder:text-white/40"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="text-[#d4af37] text-xs tracking-[0.5em]">CURATING ASSETS...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-white/50">No assets match your search.</div>
        ) : (
          filteredProducts.map((p, index) => (
            <section key={p.id} className={`flex flex-col lg:flex-row gap-16 mb-32 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className="lg:w-3/5 bg-black border border-white/10 p-8 overflow-hidden group relative">
                <img 
                  src={p.image_url || 'https://via.placeholder.com/1200x800/111/ddd?text=Calyxia+Asset'} 
                  alt={p.name} 
                  className="w-full h-auto object-contain transition-transform duration-700 group-hover:scale-[1.08]"
                />
                {(p.stock || 0) > 0 && (
                  <div className="absolute top-8 right-8 bg-black/80 px-4 py-1 text-xs tracking-widest text-emerald-400 border border-emerald-500/50">
                    {p.stock} IN VAULT
                  </div>
                )}
              </div>

              <div className="lg:w-2/5 flex flex-col justify-center">
                <span className="text-xs tracking-widest text-white/50">SELECTION NO. 0{index + 1} • ID: {p.id}</span>
                <h2 className="serif-font text-5xl md:text-6xl italic mt-6 mb-8 leading-none">{p.name}</h2>
                <p className="text-white/70 leading-relaxed mb-10 line-clamp-3">{p.description}</p>
                
                <div className="flex items-end gap-4 mb-12">
                  <div className="text-4xl text-[#d4af37]">₱{p.price ? Number(p.price).toLocaleString() : '0'}</div>
                  <div className="text-xs text-white/50 pb-1">/ {p.unit || 'ea'} • {p.stock || 0} available</div>
                </div>

                <div className="flex gap-4">
                  <Link 
                    to={`/product/${p.id}`} 
                    className="inline-block border border-[#d4af37] text-[#d4af37] px-12 py-5 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all"
                  >
                    EXPLORE PIECE
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin/products" 
                      className="inline-block border border-white/30 text-white/70 px-8 py-5 text-xs tracking-widest hover:text-white transition-all"
                    >
                      MANAGE
                    </Link>
                  )}
                </div>
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
