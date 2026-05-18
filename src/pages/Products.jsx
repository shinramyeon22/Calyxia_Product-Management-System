import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { softDeleteProduct, enrichProductsWithCurrentPrice, getPriceHistory, addPriceEntry, updateProduct } from '../services/productService';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceHistories, setPriceHistories] = useState({});
  const [priceForm, setPriceForm] = useState({ effDate: '', unitPrice: '' });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', unit: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'prodcode', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const { isSidebarOpen } = useSidebar();

  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'listing' ? 'listing' : 'products'
  );

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') === 'listing' ? 'listing' : 'products';
    setActiveTab(tabFromUrl);
  }, [searchParams]);

  useEffect(() => {
    async function getProducts() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('record_status', 'A')
          .order('prodcode', { ascending: true });

        if (error) throw error;

        const list = await enrichProductsWithCurrentPrice(data || []);
        const safeList = (list || []).map(p => ({
          ...p,
          price: p.price ?? p.current_price ?? 0,
          stock: p.stock ?? 0,
          unit: p.unit ?? 'ea',
          prodcode: p.prodcode || p.code || '—',
          description: p.description || p.name || 'Untitled Asset'
        }));
        setProducts(safeList);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    getProducts();
  }, []);

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setEditForm({ description: product.description || '', unit: product.unit || 'ea' });
    setShowEditModal(true);
  };

  const openHistoryModal = async (product) => {
    setSelectedProduct(product);
    const history = await getPriceHistory(product.prodcode);
    setPriceHistories(prev => ({ ...prev, [product.prodcode]: history }));
    setShowHistoryModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    try {
      await updateProduct(selectedProduct.id, { description: editForm.description, unit: editForm.unit });
      const { data } = await supabase.from('product').select('*').is('deleted_at', null).order('prodcode', { ascending: true });
      const list = await enrichProductsWithCurrentPrice(data || []);
      setProducts(list);
      setShowEditModal(false);
      showToast('Product updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to update: ' + err.message, 'error');
    }
  };

  const handleAddPriceEntry = async () => {
    if (!selectedProduct || !priceForm.effDate || !priceForm.unitPrice) {
      showToast('Date and price required', 'error');
      return;
    }
    try {
      await addPriceEntry(selectedProduct.prodcode, priceForm.effDate, priceForm.unitPrice, user?.id);
      const h = await getPriceHistory(selectedProduct.prodcode);
      setPriceHistories(prev => ({ ...prev, [selectedProduct.prodcode]: h }));
      setProducts(prev => prev.map(p =>
        p.prodcode === selectedProduct.prodcode
          ? { ...p, price: priceForm.unitPrice, effective_date: priceForm.effDate }
          : p
      ));
      setPriceForm({ effDate: '', unitPrice: '' });
      showToast('Price entry added!', 'success');
    } catch (err) {
      showToast('Failed to add entry: ' + err.message, 'error');
    }
  };

  const handleDelete = async (prodcode) => {
    if (!window.confirm("Are you sure you want to move this product to Deleted Items?")) return;
    try {
      await softDeleteProduct(prodcode);
      setProducts(prev => prev.filter(p => p.prodcode !== prodcode));
      showToast('Product moved to Deleted Items', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const filteredProducts = (() => {
    const list = products.filter(p =>
      p.prodcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTab !== 'listing') return list;

    return [...list].sort((a, b) => {
      let aVal = a[sortConfig.key] ?? '';
      let bVal = b[sortConfig.key] ?? '';
      if (sortConfig.key === 'price') {
        aVal = Number(aVal); bVal = Number(bVal);
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      if (sortConfig.key === 'effective_date') {
        aVal = aVal ? new Date(aVal) : new Date(0);
        bVal = bVal ? new Date(bVal) : new Date(0);
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortConfig.direction === 'asc'
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  })();

  const exportToCSV = () => {
    if (!filteredProducts.length) return;
    const headers = activeTab === 'products'
      ? ['PROD. CODE', 'DESCRIPTION', 'UNIT', 'STATUS', 'STOCK']
      : ['PRODUCT CODE', 'DESCRIPTION', 'UNIT', 'CURRENT PRICE', 'EFFECTIVE DATE'];
    const rows = filteredProducts.map(p =>
      activeTab === 'products'
        ? [p.prodcode, p.description, p.unit, p.record_status === 'A' ? 'ACTIVE' : 'INACTIVE', p.stock || 0]
        : [p.prodcode, p.description, p.unit, Number(p.price).toFixed(2), p.effective_date ? new Date(p.effective_date).toLocaleDateString() : '']
    );
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
          <div className="relative overflow-hidden">

        {/* Floating background orbs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
          <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', filter: 'blur(60px)' }} />
          <div style={{ position: 'absolute', top: '110px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.6), 0 0 0 4px rgba(99,102,241,0.12)' }} />
          <div style={{ position: 'absolute', top: '260px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.5)' }} />
          <div style={{ position: 'absolute', top: '180px', right: '14%', width: '6px', height: '6px', borderRadius: '50%', background: '#c7d2fe', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
          <div style={{ position: 'absolute', top: '60px', right: '12%', width: '120px', height: '120px', borderRadius: '28px', background: 'linear-gradient(135deg, rgba(99,102,241,0.30) 0%, rgba(139,92,246,0.12) 100%)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)', boxShadow: '0 8px 32px rgba(99,102,241,0.20)' }} />
          <div style={{ position: 'absolute', top: '140px', right: '20%', width: '70px', height: '70px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(165,180,252,0.10) 100%)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(8px)', transform: 'rotate(-12deg)', boxShadow: '0 4px 20px rgba(99,102,241,0.15)' }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 relative" style={{ zIndex: 1 }}>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs tracking-[0.4em] font-semibold block mb-2 uppercase" style={{ color: '#a5b4fc' }}>Inventory</span>
              <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter" style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>
                {activeTab === 'products' ? 'Products' : 'Product Listing'}
              </h1>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {activeTab === 'products' ? 'Manage product catalogue' : 'Current prices for all active assets'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={exportToCSV}
                disabled={!filteredProducts.length}
                className="flex items-center gap-2 text-white text-xs font-semibold tracking-wide px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}
              >
                Export CSV
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', borderRadius: '12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-4 px-6 py-4 rounded-2xl" style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 28px rgba(0,0,0,0.25)',
            }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)' }}>
                <svg className="w-5 h-5" style={{ color: '#a5b4fc' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <div className="text-3xl font-mono font-bold" style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>{products.length}</div>
                <div className="text-xs tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.35)' }}>Active Products</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search by code or description..."
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

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="text-xs tracking-[0.4em] animate-pulse uppercase" style={{ color: '#a5b4fc' }}>Loading catalogue...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.35)' }}>No products found.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl" style={{
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)',
            }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} className="text-[10px] tracking-wider uppercase font-semibold">
                    {activeTab === 'listing' ? (
                      <>
                        {[
                          { label: 'Product Code', key: 'prodcode', align: 'left' },
                          { label: 'Description',  key: 'description', align: 'left' },
                          { label: 'Unit',         key: 'unit', align: 'center' },
                          { label: 'Current Price',key: 'price', align: 'right' },
                          { label: 'Effective Date', key: 'effective_date', align: 'left' },
                        ].map(col => (
                          <th
                            key={col.key}
                            onClick={() => handleSort(col.key)}
                            className={`px-6 py-4 text-${col.align} cursor-pointer select-none transition-colors`}
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#a5b4fc'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                          >
                            <span className="inline-flex items-center gap-1">
                              {col.label}
                              <span className="inline-flex flex-col leading-none">
                                <svg className="w-2.5 h-2.5" style={{ color: sortConfig.key === col.key && sortConfig.direction === 'asc' ? '#a5b4fc' : 'rgba(255,255,255,0.2)' }} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L0 6h10z"/></svg>
                                <svg className="w-2.5 h-2.5" style={{ color: sortConfig.key === col.key && sortConfig.direction === 'desc' ? '#a5b4fc' : 'rgba(255,255,255,0.2)' }} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z"/></svg>
                              </span>
                            </span>
                          </th>
                        ))}
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Product Code</th>
                        <th className="px-6 py-4 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Description</th>
                        <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Unit</th>
                        <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</th>
                        <th className="px-6 py-4 text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <React.Fragment key={p.id}>
                      <tr
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td className="px-6 py-5 font-mono text-sm font-semibold" style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                        }}>{p.prodcode}</td>
                        <td className="px-6 py-5 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{p.description}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-block px-3 py-1 text-xs tracking-wider rounded-full uppercase" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)' }}>{p.unit}</span>
                        </td>
                        {activeTab === 'products' ? (
                          <>
                            <td className="px-6 py-5 text-center">
                              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide" style={p.record_status === 'A' ? { background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' } : { background: 'rgba(239,68,68,0.10)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                                {p.record_status === 'A' ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => openEditModal(p)}
                                  style={{ padding: '6px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#a5b4fc'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDelete(p.prodcode)}
                                  style={{ padding: '6px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-5 text-right font-mono font-semibold" style={{ color: '#a5b4fc' }}>${Number(p.price || 0).toLocaleString()}</td>
                            <td className="px-6 py-5 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.effective_date ? new Date(p.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                          </>
                        )}
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="rounded-3xl p-8 shadow-2xl w-full max-w-md" style={{
            background: 'linear-gradient(145deg, rgba(13,10,34,0.97) 0%, rgba(20,16,50,0.95) 100%)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-xs tracking-[0.4em] font-semibold uppercase" style={{ color: '#a5b4fc' }}>Edit Product</div>
                <h2 className="serif-font text-3xl italic" style={{
                  background: 'linear-gradient(135deg, #ffffff, #c7d2fe)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>Update Records</h2>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >×</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Product Code</label>
                <div className="font-mono text-base px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.6)' }}>{selectedProduct.prodcode}</div>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '12px', padding: '12px 16px', fontSize: '14px', outline: 'none', resize: 'vertical', height: '96px', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Unit</label>
                <div className="flex flex-wrap gap-2">
                  {['pc', 'ea', 'mtr', 'pkg', 'ltr'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setEditForm({ ...editForm, unit: u })}
                      style={editForm.unit === u ? { padding: '8px 16px', borderRadius: '10px', border: '1px solid #6366f1', background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' } : { padding: '8px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => { if (editForm.unit !== u) { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.5)'; e.currentTarget.style.color = '#a5b4fc'; } }}
                      onMouseLeave={e => { if (editForm.unit !== u) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; } }}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 600, borderRadius: '16px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >Cancel</button>
              <button onClick={handleSaveEdit} className="flex-1 py-3 text-white text-sm font-semibold rounded-2xl transition" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" style={{
            background: 'linear-gradient(145deg, rgba(13,10,34,0.97) 0%, rgba(20,16,50,0.95) 100%)',
            backdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }} onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
              <div>
                <div className="text-xs tracking-[0.4em] font-semibold uppercase" style={{ color: '#a5b4fc' }}>Price History</div>
                <div className="font-mono text-base font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{selectedProduct.prodcode}</div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: 'rgba(255,255,255,0.07)', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '20px', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.9)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >×</button>
            </div>

            <div className="p-8">
              <div className="rounded-2xl p-5 mb-6" style={{
                background: 'rgba(99,102,241,0.10)',
                border: '1px solid rgba(99,102,241,0.20)'
              }}>
                <div className="text-xs tracking-wider font-semibold uppercase" style={{ color: '#a5b4fc' }}>Current Price</div>
                <div className="text-5xl font-mono font-bold mt-2" style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>
                  ${Number(selectedProduct.price || 0).toLocaleString()}
                </div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Effective {selectedProduct.effective_date ? new Date(selectedProduct.effective_date).toLocaleDateString() : '—'}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>Add New Entry</div>
                <div className="flex gap-2">
                  <input
                    type="date" value={priceForm.effDate}
                    onChange={(e) => setPriceForm({ ...priceForm, effDate: e.target.value })}
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none', colorScheme: 'dark' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <input
                    type="number" step="0.01" placeholder="Price" value={priceForm.unitPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, unitPrice: e.target.value })}
                    style={{ width: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderRadius: '10px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <button
                    onClick={handleAddPriceEntry}
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >Add</button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  History ({(priceHistories[selectedProduct.prodcode] || []).length})
                </div>
                <div className="rounded-2xl overflow-hidden max-h-60 overflow-y-auto" style={{ border: '1px solid rgba(255,255,255,0.09)' }}>
                  <table className="w-full text-sm">
                    <thead style={{ background: 'rgba(255,255,255,0.05)', position: 'sticky', top: 0 }}>
                      <tr className="text-xs font-semibold uppercase tracking-wider" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th className="px-5 py-3 text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>Date</th>
                        <th className="px-5 py-3 text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(priceHistories[selectedProduct.prodcode] || []).length > 0 ? (
                        priceHistories[selectedProduct.prodcode].map((entry, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td className="px-5 py-3" style={{ color: 'rgba(255,255,255,0.65)' }}>{new Date(entry.effdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            <td className="px-5 py-3 text-right font-mono font-semibold" style={{ color: '#a5b4fc' }}>${Number(entry.unitprice).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="px-5 py-8 text-center text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>No price history yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
