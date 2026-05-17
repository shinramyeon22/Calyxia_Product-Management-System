import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { softDeleteProduct, enrichProductsWithCurrentPrice, getPriceHistory, addPriceEntry, updateProduct } from '../services/productService';
import Navbar from '../components/Navbar';
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
        aVal = Number(aVal);
        bVal = Number(bVal);
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
    <div className="min-h-screen bg-[#f8faff]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter text-[#1e1b4b]">
              {activeTab === 'products' ? 'Products' : 'Product Listing'}
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              {activeTab === 'products'
                ? 'Manage product catalogue'
                : 'Current prices for all active assets'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={!filteredProducts.length}
              className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold tracking-wide px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-[#6366f1]/20 disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold tracking-wide px-5 py-2.5 rounded-xl transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-4 bg-white border border-slate-200 px-6 py-4 rounded-2xl shadow-sm">
            <div className="w-10 h-10 bg-[#eef2ff] rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#6366f1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div className="text-3xl font-mono text-[#6366f1] font-bold">{products.length}</div>
              <div className="text-xs tracking-wider text-slate-400 uppercase">Active Products</div>
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
              className="w-full bg-white border border-slate-200 pl-11 pr-4 py-3 text-sm text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none rounded-xl transition"
            />
            <svg className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-[#6366f1] text-xs tracking-[0.4em] animate-pulse uppercase">Loading catalogue...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-slate-400">No products found.</div>
        ) : (
          <div className="bg-white border border-slate-200 overflow-hidden rounded-2xl shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] tracking-wider text-slate-400 uppercase font-semibold">
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
                          className={`px-6 py-4 text-${col.align} cursor-pointer select-none hover:text-[#6366f1] transition-colors`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            <span className="inline-flex flex-col leading-none">
                              <svg className={`w-2.5 h-2.5 ${sortConfig.key === col.key && sortConfig.direction === 'asc' ? 'text-[#6366f1]' : 'text-slate-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 0L0 6h10z"/></svg>
                              <svg className={`w-2.5 h-2.5 ${sortConfig.key === col.key && sortConfig.direction === 'desc' ? 'text-[#6366f1]' : 'text-slate-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0h10z"/></svg>
                            </span>
                          </span>
                        </th>
                      ))}
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 text-left">Product Code</th>
                      <th className="px-6 py-4 text-left">Description</th>
                      <th className="px-6 py-4 text-center">Unit</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-slate-50/60 transition-all duration-150">
                      <td className="px-6 py-5 font-mono text-sm text-[#6366f1] font-semibold">{p.prodcode}</td>
                      <td className="px-6 py-5 text-[#1e1b4b] font-medium">{p.description}</td>
                      <td className="px-6 py-5 text-center">
                        <span className="inline-block px-3 py-1 text-xs tracking-wider bg-slate-100 text-slate-500 rounded-full uppercase">{p.unit}</span>
                      </td>
                      {activeTab === 'products' ? (
                        <>
                          <td className="px-6 py-5 text-center">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide ${p.record_status === 'A' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                              {p.record_status === 'A' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => openEditModal(p)} className="p-2 text-slate-400 hover:text-[#6366f1] hover:bg-[#eef2ff] rounded-lg transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button onClick={() => handleDelete(p.prodcode)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-5 text-right font-mono font-semibold text-[#6366f1]">${Number(p.price || 0).toLocaleString()}</td>
                          <td className="px-6 py-5 text-sm text-slate-400">{p.effective_date ? new Date(p.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
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

      {/* Edit Modal */}
      {showEditModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-[#6366f1] text-xs tracking-[0.4em] font-semibold uppercase">Edit Product</div>
                <h2 className="serif-font text-3xl italic text-[#1e1b4b]">Update Records</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-xl">×</button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Product Code</label>
                <div className="font-mono text-base text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
                  {selectedProduct.prodcode}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-[#1e1b4b] focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none h-24 resize-y transition text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2 uppercase tracking-wider">Unit</label>
                <div className="flex flex-wrap gap-2">
                  {['pc', 'ea', 'mtr', 'pkg', 'ltr'].map((u) => (
                    <button
                      key={u}
                      onClick={() => setEditForm({ ...editForm, unit: u })}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all font-medium ${editForm.unit === u ? 'bg-[#6366f1] text-white border-[#6366f1]' : 'border-slate-200 text-slate-500 hover:border-[#6366f1]/40'}`}
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
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-2xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-semibold rounded-2xl transition shadow-sm shadow-[#6366f1]/25"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-5 flex justify-between items-center border-b border-slate-200 bg-slate-50">
              <div>
                <div className="text-[#6366f1] text-xs tracking-[0.4em] font-semibold uppercase">Price History</div>
                <div className="font-mono text-base text-[#1e1b4b] font-semibold mt-0.5">{selectedProduct.prodcode}</div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition text-xl">×</button>
            </div>

            <div className="p-8">
              <div className="bg-[#eef2ff] border border-[#6366f1]/20 rounded-2xl p-5 mb-6">
                <div className="text-xs tracking-wider text-[#6366f1] font-semibold uppercase">Current Price</div>
                <div className="text-5xl font-mono text-[#6366f1] mt-2 font-bold">
                  ${Number(selectedProduct.price || 0).toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Effective {selectedProduct.effective_date ? new Date(selectedProduct.effective_date).toLocaleDateString() : '—'}
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Add New Entry</div>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={priceForm.effDate}
                    onChange={(e) => setPriceForm({ ...priceForm, effDate: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:border-[#6366f1] outline-none transition"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={priceForm.unitPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, unitPrice: e.target.value })}
                    className="w-28 bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:border-[#6366f1] outline-none transition"
                  />
                  <button
                    onClick={handleAddPriceEntry}
                    className="px-5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-sm font-semibold transition whitespace-nowrap"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  History ({(priceHistories[selectedProduct.prodcode] || []).length})
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="px-5 py-3 text-left">Date</th>
                        <th className="px-5 py-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(priceHistories[selectedProduct.prodcode] || []).length > 0 ? (
                        priceHistories[selectedProduct.prodcode].map((entry, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-5 py-3 text-slate-600">{new Date(entry.effdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            <td className="px-5 py-3 text-right font-mono text-[#6366f1] font-semibold">${Number(entry.unitprice).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="px-5 py-8 text-center text-slate-400 text-xs">No price history yet.</td></tr>
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
