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

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen bg-[#f8faff] pt-20">
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
      <div className="min-h-screen bg-[#f8faff]">
        <Navbar />
        <div className="flex">
          <Sidebar />

          <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter text-[#1e1b4b]">
                  Deleted Items
                </h1>
                <p className="text-slate-400 mt-2 max-w-2xl text-sm">
                  Archived products are soft-deleted and visible only to ADMIN and SUPERADMIN. Recover items to restore them for all users.
                </p>
              </div>

              <button
                onClick={fetchDeletedProducts}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold tracking-wide px-5 py-2.5 rounded-xl transition-all"
              >
                Refresh
              </button>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search deleted products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-sm text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none rounded-xl transition"
                />
                <svg className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 mb-8 text-red-500 text-sm rounded-xl">
                {error}
              </div>
            )}

            {/* Table */}
            <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                    <th className="px-6 py-4 text-left">Product Code</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-left">Deleted At</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center text-slate-400 text-sm">
                        No deleted items found.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.prodcode} className="hover:bg-slate-50/60 transition-colors">
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
