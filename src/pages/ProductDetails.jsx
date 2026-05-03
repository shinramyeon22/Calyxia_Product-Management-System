import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useRights } from '../context/UserRightsContext';
import { acquireProduct, getProductStock, getPriceHistory, getCurrentPrice } from '../services/productService';

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth(); 
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState(0);
  const [priceHistory, setPriceHistory] = useState([]);
  const [acquiring, setAcquiring] = useState(false);
  const [acquireSuccess, setAcquireSuccess] = useState(null);
  const [displayPrice, setDisplayPrice] = useState(null);

  const [loading, setLoading] = useState(true); 
  const { hasRight, loading: rightsLoading } = useRights();
  const canViewAudit = hasRight('AUDIT_VIEW');

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from('product')
        .select('*')
        .eq('id', id)
        .single();

      setProduct(data);

      const code = data?.prodcode;
      if (!code) {
        setStock(0);
        setPriceHistory([]);
        setDisplayPrice(data?.price ?? 0);
        setLoading(false);
        return;
      }

      const [currentStock, history, resolvedPrice] = await Promise.all([
        getProductStock(code),
        getPriceHistory(code),
        getCurrentPrice(code)
      ]);

      setStock(currentStock);
      setPriceHistory(history);
      setDisplayPrice(resolvedPrice ?? data?.price ?? 0);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const handleAcquire = async () => {
    if (!hasRight('PRD_VIEW') || stock <= 0) return;
    setAcquiring(true);
    setAcquireSuccess(null);
    try {
      const result = await acquireProduct(product.prodcode);
      setStock(result.newStock);
      setAcquireSuccess({
        message: `Successfully acquired! Paid ₱${Number(result.pricePaid).toLocaleString()}`,
        newStock: result.newStock
      });
      const { data: updated } = await supabase.from('product').select('*').eq('id', id).single();
      setProduct(updated);
    } catch (err) {
      alert('Acquire failed: ' + err.message);
    } finally {
      setAcquiring(false);
    }
  };

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
          <img
            src={product.image_url?.trim() || 'https://via.placeholder.com/1200x800/111/ddd?text=Calyxia+Asset'}
            alt={product.name || product.description || 'Asset'}
            className="w-full h-auto"
          />
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <span className="text-[#d4af37] text-xs tracking-widest">INSTITUTIONAL ASSET • ID: {product.id}</span>
            
            {/* AUDIT STAMP - Only ADMIN + SUPERADMIN */}
            {canViewAudit && (
              <span className="text-white/30 text-[10px] tracking-tighter">
                VAULT ENTRY: {new Date(product.created_at).toLocaleDateString()}
              </span>
            )}
          </div>

          <h1 className="serif-font text-6xl md:text-7xl italic mt-6 leading-none">{product.description || product.name}</h1>
          
          <div className="mt-10 mb-8">
            <div className="text-5xl text-[#d4af37] mb-4">
              ₱{Number((displayPrice ?? product.price) ?? 0).toLocaleString()}
            </div>
            
            <div>
              <div className="flex items-center justify-between text-xs tracking-widest text-white/50 mb-1.5">
                <span>STOCK LEVEL</span>
                <span className={`font-mono ${stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>{stock}</span>
              </div>
              <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-[2px] bg-gradient-to-r from-[#d4af37] via-[#d4af37] to-emerald-400 transition-all duration-700 ease-out" 
                  style={{ width: `${Math.min(Math.max(stock, 0) / 10 * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          
          <p className="text-white/70 text-lg leading-relaxed">{product.description}</p>

          {hasRight('PRD_VIEW') && (
            <button 
              onClick={handleAcquire}
              disabled={acquiring || stock <= 0}
              className={`group mt-16 w-full py-6 border text-xs tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 uppercase
                ${stock > 0 
                  ? 'border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black active:scale-[0.985]' 
                  : 'border-red-500/40 text-red-400/60 cursor-not-allowed'}`}
            >
              {acquiring ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  PROCESSING ACQUISITION...
                </>
              ) : stock > 0 ? (
                <>
                  ACQUIRE THIS PIECE
                  <span className="group-hover:translate-x-1 transition">→</span>
                </>
              ) : (
                'OUT OF STOCK — UNAVAILABLE'
              )}
            </button>
          )}

          {acquireSuccess && (
            <div className="mt-8 p-8 border border-emerald-500/60 bg-black/60 text-center">
              <div className="text-emerald-400 text-6xl mb-4">✓</div>
              <div className="text-xl tracking-widest text-white mb-2">ACQUISITION COMPLETE</div>
              <div className="text-emerald-400 text-sm tracking-[0.1em] mb-6">{acquireSuccess.message}</div>
              <div className="text-[10px] text-white/40">Remaining in vault: {acquireSuccess.newStock}</div>
            </div>
          )}

          {hasRight('PRD_EDIT') && (
            <Link 
              to={`/admin/products`}
              className="mt-4 w-full py-4 bg-white/5 border border-white/10 text-white/50 text-center text-[10px] tracking-[0.3em] hover:text-white transition uppercase"
            >
              MODIFY ASSET RECORDS
            </Link>
          )}
        </div>
      </div>

      {/* Price History Section */}
      <div className="max-w-7xl mx-auto px-8 py-20 border-t border-white/10 mt-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs tracking-[0.5em] text-white/50">VALUATION ARCHIVE</span>
            <h3 className="serif-font text-4xl italic">Price History</h3>
          </div>
          
          {/* AUDIT ENABLED - Only ADMIN + SUPERADMIN */}
          {canViewAudit && <span className="text-[10px] text-white/40">AUDIT ENABLED</span>}
        </div>

        {priceHistory.length > 0 ? (
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60 border-b border-white/10">
                <tr className="text-xs tracking-widest text-white/60">
                  <th className="px-8 py-5 text-left">EFFECTIVE DATE</th>
                  <th className="px-8 py-5 text-right">UNIT PRICE (₱)</th>
                  
                  {/* RECORDED COLUMN - Only ADMIN + SUPERADMIN */}
                  {canViewAudit && <th className="px-8 py-5 text-right">RECORDED</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {priceHistory.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    <td className="px-8 py-6 text-white/80">{new Date(entry.effdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    <td className="px-8 py-6 text-right font-mono text-[#d4af37]">₱{Number(entry.unitprice).toLocaleString()}</td>
                    
                    {/* RECORDED CELL - Only ADMIN + SUPERADMIN */}
                    {canViewAudit && (
                      <td className="px-8 py-6 text-right text-xs text-white/40 font-mono">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 border border-white/10 text-white/50 text-sm">No price history recorded for this asset yet.</div>
        )}

        {/* AUDIT STAMP FOOTER - Only ADMIN + SUPERADMIN */}
        {canViewAudit && product && (
          <div className="mt-8 text-[10px] text-white/40 tracking-widest">
            AUDIT STAMP: Created {new Date(product.created_at).toLocaleString()} • Last Updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
}