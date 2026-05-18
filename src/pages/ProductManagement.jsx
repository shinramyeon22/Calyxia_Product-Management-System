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
      const newPrice = parseFloat(formData.price);
      const oldPrice = parseFloat(selectedProduct.price);
      if (!isNaN(newPrice) && newPrice > 0 && newPrice !== oldPrice) {
        const today = new Date().toISOString().split('T')[0];
        try {
          await addPriceEntry(selectedProduct.prodcode, today, newPrice, user?.id);
        } catch {
          // Duplicate entry for today — price history already has today's date; product.price was still updated
        }
      }
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



  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className={`flex-1 transition-all duration-300 flex items-center justify-center pt-20 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
            <div className="text-xs tracking-[0.4em] animate-pulse uppercase" style={{ color: '#a5b4fc' }}>Authorizing access...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-16 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

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
            <div className="mb-6 relative">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs tracking-[0.4em] font-semibold uppercase" style={{ color: '#a5b4fc' }}>Products</span>
                {isSuperAdmin && (
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-semibold" style={{ border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }}>
                    SuperAdmin
                  </span>
                )}
              </div>
              <h1 className="serif-font text-4xl italic tracking-tighter" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Manage product catalogue</h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Search products by code or description, then use the table controls to manage active and inactive inventory.</p>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-3 mb-6 flex-wrap relative">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <input
                  type="text"
                  placeholder="Search by code or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '10px 16px 10px 36px', fontSize: '13px', outline: 'none', backdropFilter: 'blur(8px)', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <svg className="absolute left-3 top-2.5 w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>

              {/* Status filter pills */}
              {userType !== 'USER' && (
                <div className="inline-flex rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  {['active', 'inactive', 'all'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      style={statusFilter === s ? { borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' } : { borderRadius: '8px', padding: '6px 16px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', background: 'transparent', color: 'rgba(255,255,255,0.45)', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                      onMouseEnter={e => { if (statusFilter !== s) e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                      onMouseLeave={e => { if (statusFilter !== s) e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
                    >
                      {s === 'active' ? 'Active' : s === 'inactive' ? 'Inactive' : 'All'}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex-1" />

              {(hasRight('PRD_ADD') || isSuperAdmin) && (
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
                >
                  + Add Product
                </button>
              )}
              <button
                onClick={fetchProducts}
                style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                Refresh
              </button>
            </div>

            {error && (
              <div className="p-4 mb-6 text-sm rounded-xl" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>{error}</div>
            )}

            {/* Table */}
            <div className="overflow-hidden rounded-2xl relative" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)', boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)' }}>
              <table className="w-full text-left text-sm table-fixed">
                <colgroup>
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} className="text-[10px] tracking-wider uppercase font-semibold">
                    <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Prod. Code</th>
                    <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Description</th>
                    <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Unit</th>
                    <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</th>
                    <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Stamp</th>
                    <th className="px-6 py-4 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
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
                          <td colSpan={6} className="px-6 py-16 text-center text-sm" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            No assets match your search or filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(p => {
                      const isExpanded = expandedRows.has(p.prodcode);
                      return (
                        <React.Fragment key={p.prodcode}>
                          <tr
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td className="px-6 py-4 font-mono text-sm font-semibold" style={{ color: '#a5b4fc' }}>{p.prodcode}</td>
                            <td className="px-6 py-4 font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.description || '—'}</td>
                            <td className="px-6 py-4 text-center text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.unit || '—'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide" style={p.record_status === 'A' ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' } : { background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                                {p.record_status === 'A' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                              {p.stamp ? new Date(p.stamp).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  onClick={() => toggleRow(p.prodcode)}
                                  style={isExpanded ? { borderRadius: '10px', border: '1px solid rgba(99,102,241,0.5)', padding: '6px', color: '#a5b4fc', background: 'rgba(99,102,241,0.15)', cursor: 'pointer', transition: 'all 0.15s' } : { borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', padding: '6px', color: 'rgba(255,255,255,0.35)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                  title={isExpanded ? 'Hide history' : 'Price history'}
                                  onMouseEnter={e => { if (!isExpanded) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.45)'; e.currentTarget.style.color = '#a5b4fc'; } }}
                                  onMouseLeave={e => { if (!isExpanded) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; } }}
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 4h18"/><path d="M7 20h10"/><path d="M12 4v16"/>
                                  </svg>
                                </button>
                                {(hasRight('PRD_EDIT') || userType === 'USER') && (
                                  <button
                                    onClick={() => openEditModal(p)}
                                    style={{ borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.color = '#a5b4fc'; e.currentTarget.style.background = 'rgba(99,102,241,0.10)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}
                                  >Edit</button>
                                )}
                                {hasRight('PRD_DEL') && (
                                  <button
                                    onClick={() => openDeleteDialog(p)}
                                    style={{ borderRadius: '10px', border: '1px solid rgba(239,68,68,0.30)', padding: '5px 12px', fontSize: '11px', fontWeight: 700, color: '#f87171', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
                                  >Delete</button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr style={{ background: 'rgba(99,102,241,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td colSpan={canViewAudit ? 8 : 7} className="px-8 py-6">
                                <div className="pl-4" style={{ borderLeft: '2px solid rgba(99,102,241,0.30)' }}>
                                  <div className="flex justify-between items-center mb-5">
                                    <div>
                                      <span className="text-xs tracking-wider font-semibold uppercase" style={{ color: '#a5b4fc' }}>Price History</span>
                                      <div className="text-base font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.description}</div>
                                    </div>
                                    {(hasRight('PRICE_ADD') || userType === 'USER') && (
                                      <div className="flex gap-2 items-end">
                                        <input
                                          type="date"
                                          value={priceForm.effDate}
                                          onChange={e => setPriceForm({ ...priceForm, effDate: e.target.value })}
                                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', colorScheme: 'dark' }}
                                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
                                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          placeholder="Unit Price"
                                          value={priceForm.unitPrice}
                                          onChange={e => setPriceForm({ ...priceForm, unitPrice: e.target.value })}
                                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', width: '120px' }}
                                          onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
                                          onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                                        />
                                        <button
                                          onClick={() => handleAddPriceEntry(p.prodcode)}
                                          style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(99,102,241,0.5)', color: '#a5b4fc', background: 'rgba(99,102,241,0.10)', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s' }}
                                          onMouseEnter={e => { e.currentTarget.style.background = '#6366f1'; e.currentTarget.style.color = '#fff'; }}
                                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.10)'; e.currentTarget.style.color = '#a5b4fc'; }}
                                        >
                                          Add Entry
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                                    <table className="w-full text-sm">
                                      <thead style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
                                        <tr className="text-[10px] font-semibold uppercase tracking-wider">
                                          <th className="px-5 py-3 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Effective Date</th>
                                          <th className="px-5 py-3 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Unit Price</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100">
                                        {(priceHistories[p.prodcode] || []).length > 0 ? priceHistories[p.prodcode].map((entry) => (
                                          <tr key={entry.effdate} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.65)' }}>{new Date(entry.effdate).toLocaleDateString()}</td>
                                            <td className="px-5 py-3 text-right font-mono font-semibold" style={{ color: '#a5b4fc' }}>${Number(entry.unitprice).toLocaleString()}</td>
                                          </tr>
                                        )) : (
                                          <tr><td colSpan="2" className="px-5 py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No price history yet.</td></tr>
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
                style={{ backgroundColor: 'rgba(8,6,20,0.80)', backdropFilter: 'blur(8px)' }}
                onClick={() => setShowAddModal(false)}
              >
                <div
                  className="relative w-full max-w-lg rounded-3xl shadow-2xl flex flex-col"
                  style={{ maxHeight: '90dvh', background: 'linear-gradient(145deg, rgba(13,10,34,0.98) 0%, rgba(20,16,50,0.96) 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="shrink-0 px-8 pt-7 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      onClick={() => setShowAddModal(false)}
                      style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '18px', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    >×</button>
                    <div className="text-center">
                      <div className="text-[10px] tracking-[0.4em] font-semibold uppercase mb-1" style={{ color: '#a5b4fc' }}>New Product</div>
                      <h2 className="serif-font text-3xl italic tracking-tighter" style={{ background: 'linear-gradient(135deg, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Create Asset</h2>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto px-8 py-6">
                    <form id="addProductForm" onSubmit={handleAddProduct} className="space-y-5">
                      <div>
                        <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Product Code (Max 6)</label>
                        <input
                          type="text" placeholder="e.g. XX0001" required maxLength={6}
                          value={formData.prodcode}
                          onChange={e => setFormData({ ...formData, prodcode: e.target.value.toUpperCase() })}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Description (Max 30)</label>
                        <textarea
                          placeholder="Short product name or label" required maxLength={30}
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', height: '80px', resize: 'none' }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Unit</label>
                        <select
                          value={formData.unit}
                          onChange={e => setFormData({ ...formData, unit: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                        >
                          <option value="ea" style={{ background: '#0d0a22' }}>EA</option>
                          <option value="pc" style={{ background: '#0d0a22' }}>PC</option>
                          <option value="mtr" style={{ background: '#0d0a22' }}>MTR</option>
                          <option value="pkg" style={{ background: '#0d0a22' }}>PKG</option>
                          <option value="ltr" style={{ background: '#0d0a22' }}>LTR</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Price ($)</label>
                        <input
                          type="number" step="0.01"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </div>
                    </form>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 px-8 pb-7 pt-5 flex gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >Cancel</button>
                    <button
                      type="submit"
                      form="addProductForm"
                      disabled={savingAsset}
                      style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 600, borderRadius: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', opacity: savingAsset ? 0.6 : 1 }}
                    >{savingAsset ? 'Saving…' : 'Create Asset'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* EDIT MODAL */}
            {showEditModal && selectedProduct && (hasRight('PRD_EDIT') || userType === 'USER') && (
              <div
                className="fixed inset-0 flex items-start justify-center z-100 pt-12 p-4"
                style={{ backgroundColor: 'rgba(8,6,20,0.80)', backdropFilter: 'blur(8px)' }}
                onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
              >
                <div
                  className="w-full max-w-lg rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
                  style={{ background: 'linear-gradient(145deg, rgba(13,10,34,0.98) 0%, rgba(20,16,50,0.96) 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="px-8 pt-7 pb-5 sticky top-0 z-10" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,10,34,0.98)' }}>
                    <button
                      onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                      style={{ position: 'absolute', top: '20px', right: '20px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '18px', cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                    >×</button>
                    <div className="text-center">
                      <div className="text-[10px] tracking-[0.4em] font-semibold uppercase mb-1" style={{ color: '#a5b4fc' }}>Edit Product</div>
                      <h2 className="serif-font text-3xl italic tracking-tighter" style={{ background: 'linear-gradient(135deg, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Update Records</h2>
                    </div>
                  </div>

                  <form onSubmit={handleEditProduct} className="px-8 py-6 space-y-5">
                    <div>
                      <label className="text-xs font-semibold block mb-1 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Product Code</label>
                      <div className="text-base font-mono px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.5)' }}>{formData.prodcode}</div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Description (Max 30)</label>
                      <textarea
                        required maxLength={30}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', height: '80px', resize: 'none' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Unit</label>
                      <select
                        value={formData.unit}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                      >
                        <option value="ea" style={{ background: '#0d0a22' }}>EA</option>
                        <option value="pc" style={{ background: '#0d0a22' }}>PC</option>
                        <option value="mtr" style={{ background: '#0d0a22' }}>MTR</option>
                        <option value="pkg" style={{ background: '#0d0a22' }}>PKG</option>
                        <option value="ltr" style={{ background: '#0d0a22' }}>LTR</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Price ($)</label>
                      <input
                        type="number" step="0.01"
                        value={formData.price}
                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => { setShowEditModal(false); setSelectedProduct(null); }}
                        style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                      >Cancel</button>
                      <button
                        type="submit"
                        style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '14px', fontWeight: 600, borderRadius: '14px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
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
                style={{ backgroundColor: 'rgba(8,6,20,0.80)', backdropFilter: 'blur(8px)' }}
                onClick={() => { setShowDeleteDialog(false); setSelectedProduct(null); }}
              >
                <div
                  className="w-full max-w-sm p-8 rounded-3xl text-center shadow-2xl"
                  style={{ background: 'linear-gradient(145deg, rgba(13,10,34,0.98) 0%, rgba(20,16,50,0.96) 100%)', border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 80px rgba(0,0,0,0.7)' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <svg className="w-7 h-7" style={{ color: '#f87171' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>Delete Asset?</h3>
                  <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    This will soft-delete <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{selectedProduct.prodcode}</span>. It can be recovered from Deleted Items.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowDeleteDialog(false); setSelectedProduct(null); }}
                      style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >Cancel</button>
                    <button
                      onClick={handleSoftDelete}
                      style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.80)', color: '#fff', fontSize: '14px', fontWeight: 600, borderRadius: '14px', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.90)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.80)'}
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
