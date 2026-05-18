/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import { useToast } from '../context/useToast';
import {
  getProductsForManagement, addProduct, updateProduct, softDeleteProduct,
  getPriceHistory, addPriceEntry, getProductByProdcode
} from '../services/productService';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ErrorBoundary from '../components/ErrorBoundary';
import { useSidebar } from '../context/SidebarContext';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [priceHistories, setPriceHistories] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const anyModalOpen = showAddModal || showEditModal || showDeleteDialog;

  const [formData, setFormData] = useState({ prodcode: '', description: '', unit: 'ea', price: '', stock: 0, image_url: '' });
  const [priceForm, setPriceForm] = useState({ effDate: '', unitPrice: '' });
  const [savingAsset, setSavingAsset] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
const [statusFilter, setStatusFilter] = useState('active');

  const { user } = useAuth();
  const { showToast } = useToast();
  const { hasRight, loading: rightsLoading } = useRights();
  const normalizeUserType = (type) => String(type || 'USER').trim().replace(/[\s_-]+/g, '').toUpperCase();
  const userType = normalizeUserType(
    user?.user_type ||
    user?.raw_user_meta_data?.user_type ||
    user?.raw_user_meta_data?.role ||
    user?.user_metadata?.user_type ||
    user?.user_metadata?.role ||
    user?.app_metadata?.user_type ||
    user?.app_metadata?.role
  );
  const isSuperAdmin = userType === 'SUPERADMIN';
  const canViewAudit = hasRight('AUDIT_VIEW');
  const { isSidebarOpen } = useSidebar();

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductsForManagement(userType);
      setProducts(data);
    } catch (err) {
      setError(err.message || 'Failed to load Product Inventory');
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'visible';
    }
    return () => { document.body.style.overflow = 'visible'; };
  }, [anyModalOpen]);

  const toggleRow = useCallback(async (prodcode) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(prodcode)) {
        newSet.delete(prodcode);
      } else {
        newSet.add(prodcode);
        if (!priceHistories[prodcode]) {
          getPriceHistory(prodcode).then(history => {
            setPriceHistories(prev => ({ ...prev, [prodcode]: history }));
          });
        }
      }
      return newSet;
    });
  }, [priceHistories]);

  const openAddModal = () => {
    if (!hasRight('PRD_ADD') && !isSuperAdmin) return;
    setFormData({ prodcode: '', description: '', unit: 'ea', price: '', stock: 0, image_url: '' });
    setShowAddModal(true);
  };

  const openEditModal = async (p) => {
    if (!hasRight('PRD_EDIT') && userType !== 'USER') return;
    try {
      const full = await getProductByProdcode(p.prodcode);
      const next = full || p;
      setSelectedProduct(next);
      setFormData({
        prodcode: next.prodcode || '',
        description: next.description || '',
        unit: next.unit || 'ea',
        price: next.price || '',
        stock: next.stock || 0,
        image_url: next.image_url || ''
      });
      setShowEditModal(true);
    } catch (err) {
      showToast('Failed to load asset for editing: ' + (err.message || err), 'error');
    }
  };

  const openDeleteDialog = (p) => {
    if (!hasRight('PRD_DEL')) return;
    setSelectedProduct(p);
    setShowDeleteDialog(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (savingAsset) return;
    const pc = formData.prodcode.trim().slice(0, 6).toUpperCase();
    const desc = formData.description.trim().slice(0, 30);
    if (!pc) return showToast('Product code required (max 6 characters)', 'error');
    if (!desc) return showToast('Description required (max 30 characters)', 'error');
    setSavingAsset(true);
    try {
      await addProduct({ ...formData, prodcode: pc, description: desc }, user?.id);
      setShowAddModal(false);
      fetchProducts();
      showToast('Asset created successfully!', 'success');
    } catch (err) {
      showToast('Add failed: ' + err.message, 'error');
    } finally {
      setSavingAsset(false);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      const desc = formData.description.trim().slice(0, 30);
      if (!desc) return showToast('Description required (max 30 characters)', 'error');
      await updateProduct(selectedProduct.prodcode, { ...formData, description: desc }, user?.id);
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
      showToast('Asset updated successfully!', 'success');
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    }
  };

  const handleSoftDelete = async () => {
    try {
      await softDeleteProduct(selectedProduct.prodcode, user?.id);
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      fetchProducts();
      showToast('Asset moved to Deleted Items', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const handleAddPriceEntry = async (prodcode) => {
    if (!hasRight('PRICE_ADD') && userType !== 'USER') return;
    if (!priceForm.effDate || !priceForm.unitPrice) return showToast('Date and price required', 'error');
    try {
      await addPriceEntry(prodcode, priceForm.effDate, priceForm.unitPrice, user?.id);
      const h = await getPriceHistory(prodcode);
      setPriceHistories(prev => ({ ...prev, [prodcode]: h }));
      setPriceForm({ effDate: '', unitPrice: '' });
      showToast('Price entry added!', 'success');
    } catch (err) {
      showToast('Price entry failed: ' + err.message, 'error');
    }
  };


  const inputClass = "w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition";

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen pt-20" style={{ background: 'linear-gradient(135deg, #ececf8 0%, #f5f5ff 45%, #eef0ff 100%)' }}>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className={`flex-1 transition-all duration-300 flex items-center justify-center ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
            <div className="text-[#6366f1] text-xs tracking-[0.4em] animate-pulse uppercase">Authorizing access...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen pt-20" style={{ background: 'linear-gradient(135deg, #ececf8 0%, #f5f5ff 45%, #eef0ff 100%)' }}>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className={`flex-1 transition-all duration-300 p-8 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

            {/* Floating background orbs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)', filter: 'blur(40px)' }} />
              <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)', filter: 'blur(30px)' }} />
              <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', filter: 'blur(50px)' }} />
              <div style={{ position: 'absolute', top: '80px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.55), 0 0 0 4px rgba(99,102,241,0.08)' }} />
              <div style={{ position: 'absolute', top: '240px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.45)' }} />
              <div style={{ position: 'absolute', top: '40px', right: '12%', width: '110px', height: '110px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.18) 100%)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)', boxShadow: '0 8px 32px rgba(99,102,241,0.10)' }} />
            </div>

            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[#6366f1] text-xs tracking-[0.4em] font-semibold uppercase">Products</span>
                {isSuperAdmin && (
                  <span className="rounded-full border border-[#6366f1]/30 bg-[#eef2ff] px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-[#6366f1] font-semibold">
                    SuperAdmin
                  </span>
                )}
              </div>
              <h1 className="serif-font text-4xl italic tracking-tighter" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Manage product catalogue</h1>
              <p className="text-slate-400 text-sm mt-1">Search products by code or description, then use the table controls to manage active and inactive inventory.</p>
            </div>

            {/* Toolbar: search + filters + actions all on one row */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/80 backdrop-blur-sm border border-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-sm text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition"
                />
                <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>

              {/* Status filter pills — admin/superadmin only */}
              {userType !== 'USER' && (
                <div className="inline-flex bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl p-1">
                  {['active', 'inactive', 'all'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold tracking-wide transition ${statusFilter === s ? 'bg-[#6366f1] text-white shadow-sm' : 'text-slate-500 hover:text-[#1e1b4b]'}`}
                    >
                      {s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'All'}
                    </button>
                  ))}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Action buttons */}
              {(hasRight('PRD_ADD') || isSuperAdmin) && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition shadow-sm shadow-[#6366f1]/20"
                >
                  + Add Product
                </button>
              )}
              <button
                onClick={fetchProducts}
                className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition"
              >
                Refresh
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 p-4 mb-6 text-red-500 text-sm rounded-xl">{error}</div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(238,242,255,0.75) 100%)', backdropFilter: 'blur(24px)', border: '1px solid rgba(99,102,241,0.14)', boxShadow: '0 2px 0 rgba(255,255,255,0.95) inset, 0 12px 40px rgba(99,102,241,0.09)' }}>
              <table className="w-full text-left text-sm table-fixed">
                <colgroup>
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead className="border-b border-slate-200/80" style={{ background: 'rgba(255,255,255,0.5)' }}>
                  <tr className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
                    <th className="px-6 py-4 text-left">Prod. Code</th>
                    <th className="px-6 py-4 text-left">Description</th>
                    <th className="px-6 py-4 text-center">Unit</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-left">Stamp</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(() => {
                    const filtered = products
                      .filter(p =>
                        (p.prodcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
.filter(p => {
                        if (statusFilter === 'active') return p.record_status === 'A';
                        if (statusFilter === 'inactive') return p.record_status === 'I';
                        return true;
                      });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-slate-400 text-sm">
                            No assets match your search or filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(p => {
                      const isExpanded = expandedRows.has(p.prodcode);
                      return (
                        <React.Fragment key={p.prodcode}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-6 py-4 font-mono text-sm text-[#6366f1] font-semibold">{p.prodcode}</td>
                            <td className="px-6 py-4 text-[#1e1b4b] font-medium truncate">{p.description || '—'}</td>
                            <td className="px-6 py-4 text-center text-xs uppercase tracking-wider text-slate-400">{p.unit || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide border ${p.record_status === 'A' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                                {p.record_status === 'A' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-400 font-mono truncate">
                              {p.stamp ? new Date(p.stamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleRow(p.prodcode)}
                                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                                    isExpanded
                                      ? 'border-[#6366f1] text-[#6366f1] bg-[#eef2ff]'
                                      : 'border-slate-200 text-slate-400 hover:border-[#6366f1]/40 hover:text-[#6366f1]'
                                  }`}
                                  title={isExpanded ? 'Hide history' : 'Price history'}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 4h18"/><path d="M7 20h10"/><path d="M12 4v16"/>
                                  </svg>
                                </button>
                                {(hasRight('PRD_EDIT') || userType === 'USER') &&
                                  <button onClick={() => openEditModal(p)} className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-[#6366f1] hover:text-[#6366f1] hover:bg-[#eef2ff] transition">Edit</button>
                                }
                                {hasRight('PRD_DEL') && (
                                  <button onClick={() => openDeleteDialog(p)} className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-50 hover:border-red-400 transition">
                                    Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-[#f8faff]">
                              <td colSpan={canViewAudit ? 8 : 7} className="px-8 py-6">
                                <div className="pl-4 border-l-2 border-[#6366f1]/20">
                                  <div className="flex justify-between items-center mb-5">
                                    <div>
                                      <span className="text-xs tracking-wider text-[#6366f1] font-semibold uppercase">Price History</span>
                                      <div className="text-base font-semibold text-[#1e1b4b] mt-1">{p.description}</div>
                                    </div>
                                    {(hasRight('PRICE_ADD') || userType === 'USER') && (
                                      <div className="flex gap-2 items-end">
                                        <input
                                          type="date"
                                          value={priceForm.effDate}
                                          onChange={e => setPriceForm({ ...priceForm, effDate: e.target.value })}
                                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:border-[#6366f1] outline-none transition"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder="Unit Price"
                                          value={priceForm.unitPrice}
                                          onChange={e => setPriceForm({ ...priceForm, unitPrice: e.target.value })}
                                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm w-32 focus:border-[#6366f1] outline-none transition"
                                        />
                                        <button
                                          onClick={() => handleAddPriceEntry(p.prodcode)}
                                          className="px-4 py-2 text-xs font-semibold border border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white rounded-xl transition"
                                        >
                                          Add Entry
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead className="border-b border-slate-200/80" style={{ background: 'rgba(255,255,255,0.5)' }}>
                                        <tr className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                          <th className="px-5 py-3 text-left">Effective Date</th>
                                          <th className="px-5 py-3 text-right">Unit Price</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {(priceHistories[p.prodcode] || []).length > 0 ? priceHistories[p.prodcode].map((entry) => (
                                          <tr key={entry.effdate} className="hover:bg-slate-50">
                                            <td className="px-5 py-3 text-slate-600">{new Date(entry.effdate).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-right font-mono text-[#6366f1] font-semibold">${Number(entry.unitprice).toLocaleString()}</td>
                                          </tr>
                                        )) : (
                                          <tr><td colSpan="2" className="px-5 py-8 text-center text-slate-400 text-xs">No price history yet.</td></tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals */}
        {createPortal(
          <>
            {/* ADD MODAL */}
            {showAddModal && (
              <div
                className="fixed inset-0 flex items-center justify-center z-200 p-4"
                style={{ backgroundColor: 'rgba(30,27,75,0.35)', backdropFilter: 'blur(6px)' }}
                onClick={() => setShowAddModal(false)}
              >
                <div
                  className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl flex flex-col"
                  style={{ maxHeight: '90dvh' }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="shrink-0 px-8 pt-7 pb-5 border-b border-slate-200">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-lg transition"
                    >×</button>
                    <div className="text-center">
                      <div className="text-[#6366f1] text-[10px] tracking-[0.4em] font-semibold uppercase mb-1">New Product</div>
                      <h2 className="serif-font text-3xl italic tracking-tighter text-[#1e1b4b]">Create Asset</h2>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <form id="addProductForm" onSubmit={handleAddProduct} className="space-y-5">
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Product Code (Max 6)</label>
                        <input
                          type="text" placeholder="e.g. XX0001" required maxLength={6}
                          value={formData.prodcode}
                          onChange={e => setFormData({ ...formData, prodcode: e.target.value.toUpperCase() })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Description (Max 30)</label>
                        <textarea
                          placeholder="Short product name or label" required maxLength={30}
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          className={`${inputClass} h-20 resize-none`}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Unit</label>
                        <select
                          value={formData.unit}
                          onChange={e => setFormData({ ...formData, unit: e.target.value })}
                          className={inputClass}
                        >
                          <option value="ea">EA</option>
                          <option value="pc">PC</option>
                          <option value="mtr">MTR</option>
                          <option value="pkg">PKG</option>
                          <option value="ltr">LTR</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Price ($)</label>
                        <input
                          type="number" step="0.01"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-8 pb-7 pt-5 border-t border-slate-200 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                    >Cancel</button>
                    <button
                      type="submit"
                      form="addProductForm"
                      disabled={savingAsset}
                      className="flex-1 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-[#6366f1]/20 disabled:opacity-50"
                    >{savingAsset ? 'Saving…' : 'Create Asset'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && selectedProduct && (hasRight('PRD_EDIT') || userType === 'USER') && (
              <div
                className="fixed inset-0 flex items-start justify-center z-100 pt-12 p-4"
                style={{ backgroundColor: 'rgba(30,27,75,0.35)', backdropFilter: 'blur(6px)' }}
                onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
              >
                <div
                  className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-8 pt-7 pb-5 border-b border-slate-200 sticky top-0 bg-white z-10">
                    <button
                      onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                      className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-lg transition"
                    >×</button>
                    <div className="text-center">
                      <div className="text-[#6366f1] text-[10px] tracking-[0.4em] font-semibold uppercase mb-1">Edit Product</div>
                      <h2 className="serif-font text-3xl italic tracking-tighter text-[#1e1b4b]">Update Records</h2>
                    </div>
                  </div>

                  <form onSubmit={handleEditProduct} className="px-8 py-6 space-y-5">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1">Product Code</label>
                      <div className="text-base font-mono text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">{formData.prodcode}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Description (Max 30)</label>
                      <textarea
                        required maxLength={30}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className={`${inputClass} h-20 resize-none`}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Unit</label>
                      <select
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        className={inputClass}
                      >
                        <option value="ea">EA</option>
                        <option value="pc">PC</option>
                        <option value="mtr">MTR</option>
                        <option value="pkg">PKG</option>
                        <option value="ltr">LTR</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Price ($)</label>
                      <input
                        type="number" step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                        className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                      >Cancel</button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-semibold transition shadow-sm shadow-[#6366f1]/20"
                      >Save Changes</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* DELETE DIALOG */}
            {showDeleteDialog && selectedProduct && hasRight('PRD_DEL') && (
              <div
                className="fixed inset-0 flex items-start justify-center z-100 pt-24 p-6"
                style={{ backgroundColor: 'rgba(30,27,75,0.35)', backdropFilter: 'blur(6px)' }}
                onClick={() => { setShowDeleteDialog(false); setSelectedProduct(null); }}
              >
                <div
                  className="bg-white w-full max-w-sm p-8 rounded-3xl text-center shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1e1b4b] mb-2">Delete Asset?</h3>
                  <p className="text-slate-400 text-sm mb-7">
                    This will soft-delete <span className="text-[#1e1b4b] font-semibold">{selectedProduct.prodcode}</span>. It can be recovered from Deleted Items.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteDialog(false); setSelectedProduct(null); }}
                      className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
                    >Cancel</button>
                    <button
                      onClick={handleSoftDelete}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition"
                    >Yes, Delete</button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
      </div>
    </ErrorBoundary>
  );
}
