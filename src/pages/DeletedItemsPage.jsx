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
    {/* Removed pt-20 from outer div to let inner padding handle the top spacing */}
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="flex">
        <Sidebar />
        
        {/* Unified Layout Container: Matches Product Page Spacing */}
        <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          
          {/* Header Section: Matches Product Page Font Sizes */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              {/* Added serif-font and matched the text-6xl md:text-7xl size */}
              <h1 className="serif-font text-6xl md:text-7xl italic tracking-tighter">
                Deleted Items
              </h1>
              <p className="text-white/60 mt-2 max-w-2xl">
                Archived products are soft-deleted and visible only to ADMIN and SUPERADMIN. Recover items to restore them for all users.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={fetchDeletedProducts} 
                className="border border-white/20 hover:bg-white/5 text-xs tracking-[0.15em] px-6 py-3 rounded transition-all"
              >
                REFRESH
              </button>
            </div>
          </div>

          {/* Search Bar: Matched Product Page Styling */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center">
            <div className="relative flex-1 max-w-md w-full">
              <input 
                type="text" 
                placeholder="Search deleted products..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full bg-black border border-white/10 pl-12 py-4 text-sm focus:border-[#d4af37] outline-none rounded-2xl" 
              />
              <div className="absolute left-5 top-4 text-white/40">🔍</div>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-6 mb-10 text-red-400 rounded-2xl">
              {error}
            </div>
          )}

          {/* Table Container: Matched Product Page "Vault" style */}
          <div className="border border-white/10 overflow-hidden rounded-2xl shadow-2xl bg-black/40">
            <table className="w-full text-sm">
              <thead>
                {/* Matched the Product page table header style */}
                <tr className="bg-black/70 border-b border-white/10 text-[10px] tracking-[0.2em] text-white/60 uppercase">
                  <th className="px-8 py-5 text-left">ID</th>
                  <th className="px-8 py-5 text-left">Description</th>
                  <th className="px-8 py-5 text-left">Stamp</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-8 py-16 text-center text-white/50">
                      No deleted items found.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => (
                    <tr key={p.prodcode} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-mono text-[#d4af37]">{p.prodcode}</td>
                      <td className="px-8 py-6 text-white/80">{p.description || p.name || '—'}</td>
                      <td className="px-8 py-6 text-white/40 text-xs">
                        {p.stamp ? new Date(p.stamp).toLocaleString() : '—'}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          onClick={() => handleRecover(p.prodcode)} 
                          className="px-3 py-1.5 border border-emerald-500/50 text-emerald-400 text-[10px] rounded hover:bg-emerald-500 hover:text-black transition"
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