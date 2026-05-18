/* eslint-disable react-hooks/set-state-in-effect */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRights } from '../context/UserRightsContext';
import { getProductsForManagement, recoverProduct } from '../services/productService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSidebar } from '../context/SidebarContext';

export default function DeletedItemsPage() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRight, loading: rightsLoading } = useRights();
  const navigate = useNavigate();
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    if (rightsLoading) return;
    if (!hasRight('PRD_RESTORE')) {
      navigate('/admin/products', { replace: true });
    }
  }, [hasRight, rightsLoading, navigate]);

  const fetchDeletedProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await getProductsForManagement('ADMIN');
      setProducts(all.filter(p => p.record_status === 'I'));
    } catch (err) {
      setError(err.message || 'Failed to load deleted items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeletedProducts();
  }, [fetchDeletedProducts]);

  const handleRecover = async (prodcode) => {
    if (!window.confirm('Recover this product?')) return;
    try {
      await recoverProduct(prodcode);
      await fetchDeletedProducts();
    } catch (err) {
      alert('Failed to recover: ' + err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      p.prodcode?.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      (p.name || '').toLowerCase().includes(query)
    );
  });

  const darkBg = { background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' };

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen" style={darkBg}>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className={`flex-1 transition-all duration-300 flex items-center justify-center pt-20 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
            <div className="text-xs tracking-[0.4em] animate-pulse uppercase" style={{ color: '#a5b4fc' }}>Loading deleted records...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={darkBg}>
        <Navbar />
        <div className="flex">
          <Sidebar />

          <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

            {/* Floating background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }} />
              <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', filter: 'blur(60px)' }} />
              <div style={{ position: 'absolute', top: '110px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.6), 0 0 0 4px rgba(99,102,241,0.12)' }} />
              <div style={{ position: 'absolute', top: '260px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.5)' }} />
              <div style={{ position: 'absolute', top: '180px', right: '14%', width: '6px', height: '6px', borderRadius: '50%', background: '#c7d2fe', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
              <div style={{ position: 'absolute', top: '60px', right: '12%', width: '120px', height: '120px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.30) 0%, rgba(139,92,246,0.12) 100%)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)', boxShadow: '0 8px 32px rgba(99,102,241,0.20)' }} />
              <div style={{ position: 'absolute', top: '140px', right: '20%', width: '70px', height: '70px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(165,180,252,0.10) 100%)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', transform: 'rotate(-12deg)', boxShadow: '0 4px 20px rgba(99,102,241,0.15)' }} />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative">
              <div>
                <span className="text-xs tracking-[0.4em] font-semibold block mb-2 uppercase" style={{ color: '#a5b4fc' }}>Archive</span>
                <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                  Deleted Items
                </h1>
                <p className="mt-2 max-w-2xl text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Archived products are soft-deleted and visible only to ADMIN and SUPERADMIN. Recover items to restore them for all users.
                </p>
              </div>
              <button
                onClick={fetchDeletedProducts}
                style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: '14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="mb-8 relative">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search deleted products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '12px 16px 12px 44px', fontSize: '13px', outline: 'none', backdropFilter: 'blur(12px)', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <svg className="absolute left-4 top-3.5 w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>

            {error && (
              <div className="p-4 mb-8 text-sm rounded-xl" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>{error}</div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl relative" style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)',
            }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} className="text-[10px] tracking-wider uppercase font-semibold">
                    <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Product Code</th>
                    <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Description</th>
                    <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Deleted At</th>
                    <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        No deleted items found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr
                        key={p.prodcode}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-6 py-5 font-mono text-sm font-semibold" style={{ color: '#a5b4fc' }}>{p.prodcode}</td>
                        <td className="px-6 py-5 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.description || p.name || '—'}</td>
                        <td className="px-6 py-5 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {p.stamp ? new Date(p.stamp).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => handleRecover(p.prodcode)}
                            style={{ padding: '5px 16px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.30)', color: '#34d399', background: 'transparent', fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.12)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.55)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.30)'; }}
                          >
                            Recover
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
