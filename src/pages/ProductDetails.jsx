import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useRights } from '../context/UserRightsContext';
import { acquireProduct, getProductStock, getPriceHistory, getCurrentPrice } from '../services/productService';

export default function ProductDetails() {
  const { id } = useParams();
  const { user: _user } = useAuth();
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
      const { data } = await supabase.from('product').select('*').eq('id', id).single();
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
        message: `Successfully acquired! Paid $${Number(result.pricePaid).toLocaleString()}`,
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

  const pageStyle = { background: 'linear-gradient(135deg, #ececf8 0%, #f5f5ff 45%, #eef0ff 100%)' };

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={pageStyle}>
        <p className="text-[#6366f1] text-xs tracking-widest animate-pulse uppercase">Authenticating access...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={pageStyle}>
        <div className="text-center">
          <h1 className="text-4xl serif-font italic text-[#1e1b4b]">Asset Not Found</h1>
          <Link to="/products" className="mt-8 inline-block text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors">
            ← Return to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20" style={pageStyle}>
      <Navbar />

      {/* Floating background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)', filter: 'blur(30px)' }} />
        <div style={{ position: 'absolute', bottom: '80px', left: '10%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', filter: 'blur(50px)' }} />
        <div style={{ position: 'absolute', top: '110px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.55), 0 0 0 4px rgba(99,102,241,0.08)' }} />
        <div style={{ position: 'absolute', top: '60px', right: '14%', width: '90px', height: '90px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.18) 100%)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)' }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <nav className="px-4 md:px-8 py-8">
          <Link to="/products" className="text-xs font-semibold tracking-wider text-[#6366f1] hover:text-[#4f46e5] transition-colors">
            ← Back to Products
          </Link>
        </nav>

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid md:grid-cols-2 gap-12 pb-20">
          {/* Product Image */}
          <div className="overflow-hidden rounded-2xl p-8" style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(238,242,255,0.75) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(99,102,241,0.14)',
            boxShadow: '0 2px 0 rgba(255,255,255,0.95) inset, 0 12px 40px rgba(99,102,241,0.09)'
          }}>
            <img
              src={product.image_url?.trim() || 'https://via.placeholder.com/1200x800/eef2ff/6366f1?text=Calyxia+Asset'}
              alt={product.name || product.description || 'Asset'}
              className="w-full h-auto rounded-xl"
            />
          </div>

          {/* Product Info */}
          <div className="flex flex-col justify-center">
            <div className="flex justify-between items-start">
              <span className="text-[#6366f1] text-xs font-semibold tracking-wider uppercase">
                Product · ID: {product.id}
              </span>
              {canViewAudit && (
                <span className="text-slate-400 text-[10px] tracking-tight">
                  Added: {new Date(product.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="serif-font text-5xl md:text-6xl italic mt-4 leading-tight" style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
            }}>
              {product.description || product.name}
            </h1>

            <div className="mt-8 mb-6">
              <div className="text-4xl font-mono font-bold mb-4" style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                ${Number((displayPrice ?? product.price) ?? 0).toLocaleString()}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400 mb-2 uppercase">
                  <span>Stock Level</span>
                  <span className={`font-mono ${stock > 0 ? 'text-emerald-500' : 'text-red-400'}`}>{stock}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(Math.max(stock, 0) / 10 * 100, 100)}%`,
                      background: 'linear-gradient(90deg, #6366f1, #10b981)'
                    }}
                  />
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-base leading-relaxed">{product.description}</p>

            {hasRight('PRD_VIEW') && (
              <button
                onClick={handleAcquire}
                disabled={acquiring || stock <= 0}
                className={`mt-10 w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition-all flex items-center justify-center gap-3 ${
                  stock > 0 ? 'text-white active:scale-[0.98]' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
                style={stock > 0 ? {
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 8px 32px rgba(99,102,241,0.35)'
                } : {}}
              >
                {acquiring ? (
                  <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Processing...</>
                ) : stock > 0 ? (
                  <>Acquire This Piece →</>
                ) : (
                  'Out of Stock — Unavailable'
                )}
              </button>
            )}

            {acquireSuccess && (
              <div className="mt-6 p-6 rounded-2xl text-center" style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(255,255,255,0.85) 100%)',
                border: '1px solid rgba(16,185,129,0.20)'
              }}>
                <div className="text-emerald-500 text-4xl mb-3">✓</div>
                <div className="text-base font-semibold text-emerald-700 mb-1">Acquisition Complete</div>
                <div className="text-emerald-600 text-sm mb-3">{acquireSuccess.message}</div>
                <div className="text-xs text-slate-400">Remaining in stock: {acquireSuccess.newStock}</div>
              </div>
            )}

            {hasRight('PRD_EDIT') && (
              <Link
                to="/admin/products"
                className="mt-3 w-full py-3 text-center text-xs font-semibold tracking-wider transition-all rounded-2xl"
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(238,242,255,0.70) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(99,102,241,0.15)',
                  color: '#6366f1'
                }}
              >
                Modify Asset Records
              </Link>
            )}
          </div>
        </div>

        {/* Price History */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12" style={{ borderTop: '1px solid rgba(99,102,241,0.12)' }}>
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-xs font-semibold tracking-[0.4em] text-[#6366f1] uppercase block mb-1">Valuation Archive</span>
              <h3 className="serif-font text-4xl italic" style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>Price History</h3>
            </div>
            {canViewAudit && <span className="text-[10px] text-slate-400 tracking-wider uppercase">Audit Enabled</span>}
          </div>

          {priceHistory.length > 0 ? (
            <div className="overflow-x-auto rounded-2xl" style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(238,242,255,0.75) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.14)',
              boxShadow: '0 2px 0 rgba(255,255,255,0.95) inset, 0 12px 40px rgba(99,102,241,0.09)'
            }}>
              <table className="w-full text-sm min-w-[640px]">
                <thead className="border-b border-slate-200/80" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <tr className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                    <th className="px-6 py-4 text-left">Effective Date</th>
                    <th className="px-6 py-4 text-right">Unit Price ($)</th>
                    {canViewAudit && <th className="px-6 py-4 text-right">Recorded</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {priceHistory.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-white/60">
                      <td className="px-6 py-5 text-slate-600">{new Date(entry.effdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td className="px-6 py-5 text-right font-mono text-[#6366f1] font-semibold">${Number(entry.unitprice).toLocaleString()}</td>
                      {canViewAudit && (
                        <td className="px-6 py-5 text-right text-xs text-slate-400 font-mono">
                          {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 rounded-2xl text-slate-400 text-sm" style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.85) 0%, rgba(238,242,255,0.60) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px dashed rgba(99,102,241,0.20)'
            }}>
              No price history recorded for this asset yet.
            </div>
          )}

          {canViewAudit && product && (
            <div className="mt-6 text-[10px] text-slate-400 tracking-wider">
              Audit Stamp: Created {new Date(product.created_at).toLocaleString()} · Last Updated: {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
