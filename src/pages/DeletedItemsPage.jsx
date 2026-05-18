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

  const pageStyle = { background: 'linear-gradient(135deg, #ececf8 0%, #f5f5ff 45%, #eef0ff 100%)' };

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen pt-20" style={pageStyle}>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className={`flex-1 transition-all duration-300 flex items-center justify-center ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
            <div className="text-[#6366f1] text-xs tracking-[0.4em] animate-pulse uppercase">Loading deleted records...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={pageStyle}>
        <Navbar />
        <div className="flex">
          <Sidebar />

          <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

            {/* Floating background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)', filter: 'blur(30px)' }} />
              <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', filter: 'blur(50px)' }} />
              <div style={{ position: 'absolute', top: '80px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.55), 0 0 0 4px rgba(99,102,241,0.08)' }} />
              <div style={{ position: 'absolute', top: '240px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.45)' }} />
              <div style={{ position: 'absolute', top: '60px', right: '12%', width: '110px', height: '110px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.18) 100%)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)', boxShadow: '0 8px 32px rgba(99,102,241,0.10)' }} />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 relative">
              <div>
                <span className="text-[#6366f1] text-xs tracking-[0.4em] font-semibold block mb-2 uppercase">Archive</span>
                <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter" style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                  Deleted Items
                </h1>
                <p className="text-slate-400 mt-2 max-w-2xl text-sm">
                  Archived products are soft-deleted and visible only to ADMIN and SUPERADMIN. Recover items to restore them for all users.
                </p>
              </div>
              <button
                onClick={fetchDeletedProducts}
                className="border border-slate-200 bg-white/70 hover:bg-white text-slate-600 text-xs font-semibold tracking-wide px-5 py-2.5 rounded-xl transition-all backdrop-blur-sm"
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
                  className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 pl-11 pr-4 py-3 text-sm text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none rounded-xl transition"
                />
                <svg className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 border border-red-200 p-4 mb-8 text-red-500 text-sm rounded-xl">{error}</div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl relative" style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(238,242,255,0.75) 100%)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(99,102,241,0.14)',
              boxShadow: '0 2px 0 rgba(255,255,255,0.95) inset, 0 12px 40px rgba(99,102,241,0.09)'
            }}>
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200/80" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <tr className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                    <th className="px-6 py-4 text-left">Product Code</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Deleted At</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-slate-400 text-sm">
                        No deleted items found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.prodcode} className="hover:bg-white/60 transition-colors">
                        <td className="px-6 py-5 font-mono text-sm text-[#6366f1] font-semibold">{p.prodcode}</td>
                        <td className="px-6 py-5 text-[#1e1b4b] font-medium">{p.description || p.name || '—'}</td>
                        <td className="px-6 py-5 text-slate-400 text-xs">
                          {p.stamp ? new Date(p.stamp).toLocaleString() : '—'}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button
                            onClick={() => handleRecover(p.prodcode)}
                            className="px-4 py-1.5 border border-emerald-200 text-emerald-600 text-xs font-semibold rounded-xl hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
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
