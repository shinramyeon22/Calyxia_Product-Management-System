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
    <div className="min-h-screen bg-[#050505] text-white relative isolate">
      <Navbar />

      {/* --- PERSISTENT SCROLLING BACKGROUND --- */}
      {/* This layer stays fixed so as you scroll, the quilted pattern is always there */}
      <div 
        className="fixed inset-0 z-[-1] pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `url('https://i.ibb.co/Vvz7fQv/quilted-pattern.png')`, // Reference to your quilted image
          backgroundSize: '320px',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'screen'
        }}
      ></div>

      {/* --- HERO SECTION: PRESERVED --- */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070" 
          alt="Calyxia Background" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/75 to-[#050505]"></div>
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#d4af37]/10 via-transparent to-transparent"></div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <span className="text-[#d4af37] text-xs tracking-[0.6em] uppercase">The Private Collection</span>
          <h1 className="serif-font text-8xl md:text-[5.8rem] italic mt-8 tracking-[-2px] text-white drop-shadow-2xl">
            Calyxia Collections
          </h1>
          <p className="mt-10 text-white/70 text-xl max-w-lg mx-auto leading-relaxed italic">
            Curated institutional assets. Each piece tells a story of craftsmanship and rarity.
          </p>
          <div className="w-28 h-px bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent mx-auto mt-16"></div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-[#d4af37] text-xs tracking-widest flex flex-col items-center">
          <span>SCROLL TO EXPLORE</span>
          <div className="w-px h-12 bg-gradient-to-b from-[#d4af37]/40 to-transparent mt-3"></div>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        {/* Search */}
        <div className="mb-20 flex justify-end">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="SEARCH ASSETS..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full max-w-xs bg-black/60 backdrop-blur-md border border-white/10 px-6 py-4 text-xs tracking-[0.3em] focus:border-[#d4af37] outline-none transition-all placeholder:text-white/20"
            />
            <div className="absolute bottom-0 left-0 h-[1px] bg-[#d4af37] w-0 group-focus-within:w-full transition-all duration-500"></div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="text-[#d4af37] text-xs tracking-[0.5em] animate-pulse uppercase">Accessing Vault...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-white/40 serif-font italic text-xl">No assets found in current selection.</div>
        ) : (
          <div className="space-y-48">
            {filteredProducts.map((p, index) => (
              <section 
                key={p.id} 
                className={`flex flex-col lg:flex-row gap-16 items-center p-8 md:p-14 rounded-[2.5rem] bg-black/40 backdrop-blur-xl border border-white/5 transition-all duration-700 hover:border-[#d4af37]/20 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Asset Display */}
                <div className="lg:w-3/5 group relative">
                  <div className="absolute -inset-2 bg-[#d4af37]/5 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                  <div className="relative bg-[#0a0a0a] border border-white/10 p-4 md:p-10 rounded-2xl overflow-hidden shadow-2xl">
                    <img 
                      src={p.image_url || 'https://via.placeholder.com/1200x800/111/ddd?text=Calyxia+Asset'} 
                      alt={p.name} 
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/1200x800/111/ddd?text=Image+Unavailable';
                      }}
                      className="w-full h-[450px] object-contain transition-transform duration-[2s] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
                    {(p.stock || 0) > 0 && (
                      <div className="absolute top-8 right-8 bg-[#d4af37] px-5 py-2 text-[10px] tracking-[0.2em] text-black font-bold uppercase">
                        {p.stock} In Vault
                      </div>
                    )}
                  </div>
                </div>

                {/* Asset Details */}
                <div className="lg:w-2/5 space-y-8">
                  <div className="space-y-3">
                    <span className="text-[10px] tracking-[0.4em] text-[#d4af37] font-bold uppercase">Selection 0{index + 1}</span>
                    <h2 className="serif-font text-5xl md:text-6xl italic text-white/95 leading-tight">{p.name}</h2>
                  </div>
                  
                  <p className="text-white/50 font-light leading-relaxed text-lg italic italic line-clamp-4">
                    "{p.description}"
                  </p>
                  
                  <div className="pt-6 pb-4 border-b border-white/10 flex items-end gap-4">
                    <span className="text-4xl font-light text-[#d4af37] tracking-tighter">
                      ₱{p.price ? Number(p.price).toLocaleString() : '0'}
                    </span>
                    <span className="text-[10px] text-white/30 tracking-[0.2em] uppercase pb-1.5">Market Appraisal</span>
                  </div>

                  <div className="flex flex-wrap gap-6 pt-6">
                    <Link 
                      to={`/product/${p.id}`} 
                      className="group relative overflow-hidden border border-[#d4af37]/50 px-14 py-5 text-[10px] tracking-[0.3em] text-[#d4af37] font-bold transition-all"
                    >
                      <span className="relative z-10 group-hover:text-black transition-colors duration-300 uppercase">Explore Piece</span>
                      <div className="absolute inset-0 bg-[#d4af37] translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    </Link>
                    {isAdmin && (
                      <Link 
                        to="/admin/products" 
                        className="px-8 py-5 text-[10px] tracking-[0.3em] text-white/30 border border-white/10 hover:text-white hover:border-white/40 transition-all uppercase"
                      >
                        Management
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      {/* --- FOOTER DESIGN --- */}
      <footer className="py-32 flex flex-col items-center justify-center">
        <div className="w-px h-24 bg-gradient-to-b from-[#d4af37]/40 to-transparent mb-8"></div>
        <p className="text-[10px] tracking-[0.6em] text-[#d4af37]/40 uppercase">Calyxia Private Registry</p>
      </footer>
    </div>
  );
}