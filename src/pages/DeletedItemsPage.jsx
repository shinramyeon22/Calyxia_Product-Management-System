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
  // Redirect if no restore right (USER and those without per matrix)
  useEffect(() => {
    if (rightsLoading) return;
    if (!hasRight('PRD_RESTORE')) {
      navigate('/products', { replace: true });
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

  // Initial load
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

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-20">
        <Navbar />
<div className="flex">
  <Sidebar />
  <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
            <div className="text-center">
              <div className="w-8 h-[1px] bg-[#d4af37] mx-auto mb-6 animate-pulse"></div>
              <p className="text-[#d4af37] text-xs tracking-[0.5em]">LOADING DELETED RECORDS...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-white pt-20">
        <Navbar />
        <div className="flex">
          <Sidebar />
        <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
            <div className="flex flex-col gap-6 mb-12">
              <div>
                <span className="block text-[#d4af37] text-xs tracking-[0.5em]">ARCHIVE</span>
                <h1 className="serif-font text-6xl italic tracking-tighter">Deleted Items</h1>
                <p className="text-white/60 max-w-2xl mt-3">Archived products are soft-deleted and visible only to ADMIN and SUPERADMIN. Recover items to restore them for all users.</p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search deleted products..."
                    className="w-full bg-transparent border border-white/10 px-6 py-4 text-sm tracking-widest outline-none focus:border-[#d4af37] placeholder:text-white/40"
                  />
                </div>
                <button 
                  onClick={fetchDeletedProducts} 
                  className="rounded-full border border-[#d4af37] px-8 py-4 text-xs tracking-widest text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition"
                >
                  REFRESH
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 p-6 mb-10 text-red-400">
                {error}
              </div>
            )}

            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/50 border-b border-white/10">
                  <tr className="text-xs tracking-widest text-white/60">
                    <th className="px-8 py-6">ID</th>
                    <th className="px-8 py-6">DESCRIPTION</th>
                    <th className="px-8 py-6">STAMP</th>
                    <th className="px-8 py-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center text-white/50">
                        No deleted items found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.prodcode} className="hover:bg-white/5 transition">
                        <td className="px-8 py-8 font-mono text-sm">{p.prodcode}</td>
                        <td className="px-8 py-8">{p.description || p.name || '—'}</td>
                        <td className="px-8 py-8 text-xs text-white/50">
                          {p.stamp ? new Date(p.stamp).toLocaleString() : '—'}
                        </td>
                        <td className="px-8 py-8 text-right">
                          <button 
                            onClick={() => handleRecover(p.prodcode)} 
                            className="text-emerald-400 hover:text-emerald-300 text-sm tracking-widest"
                          >
                            RECOVER
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