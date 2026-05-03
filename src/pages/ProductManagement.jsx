/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import { useToast } from '../context/useToast';
import { 
  getProducts, addProduct, updateProduct, softDeleteProduct, 
  getPriceHistory, addPriceEntry, getCurrentPrice 
} from '../services/productService';

import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [priceHistories, setPriceHistories] = useState({});
  const [currentPrices, setCurrentPrices] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [formData, setFormData] = useState({ name: '', description: '', unit: 'ea', price: '', stock: 0, image_url: '' });
  const [priceForm, setPriceForm] = useState({ effDate: '', unitPrice: '' });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const { user } = useAuth();
  const { showToast } = useToast();
  const { hasRight, loading: rightsLoading } = useRights();
  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const canViewAudit = hasRight('AUDIT_VIEW');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts(userType);
      setProducts(data);

      const prices = {};
      for (const p of data) {
        prices[p.prodcode] = await getCurrentPrice(p.prodcode);
      }
      setCurrentPrices(prices);
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
    if (!hasRight('PRD_ADD')) return; 
    setFormData({ name: '', description: '', unit: 'ea', price: '', stock: 0, image_url: '' });
    setShowAddModal(true);
  };

  const openEditModal = (p) => {
    if (!hasRight('PRD_EDIT')) return;
    setSelectedProduct(p);
    setFormData({ 
      name: p.name || '', 
      description: p.description || '', 
      unit: p.unit || 'ea',
      price: p.price || '',
      stock: p.stock || 0,
      image_url: p.image_url || ''
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (p) => {
    if (!hasRight('PRD_DEL')) return;
    setSelectedProduct(p);
    setShowDeleteDialog(true);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addProduct(formData);
      setShowAddModal(false);
      fetchProducts();
      showToast('Asset created successfully!', 'success');
    } catch (err) {
      showToast('Add failed: ' + err.message, 'error');
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(selectedProduct.prodcode, formData);
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
      await softDeleteProduct(selectedProduct.prodcode);
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      fetchProducts();
      showToast('Asset moved to Deleted Items', 'success');
    } catch (err) {
      showToast('Delete failed: ' + err.message, 'error');
    }
  };

  const handleAddPriceEntry = async (prodcode) => {
    if (!hasRight('PRICE_ADD')) return;
    if (!priceForm.effDate || !priceForm.unitPrice) return showToast('Date and price required', 'error');
    try {
      await addPriceEntry(prodcode, priceForm.effDate, priceForm.unitPrice);
      const h = await getPriceHistory(prodcode);
      setPriceHistories(prev => ({ ...prev, [prodcode]: h }));
      const np = await getCurrentPrice(prodcode);
      setCurrentPrices(prev => ({ ...prev, [prodcode]: np }));
      setPriceForm({ effDate: '', unitPrice: '' });
      showToast('Price entry added!', 'success');
    } catch (err) {
      showToast('Price entry failed: ' + err.message, 'error');
    }
  };

  if (loading || rightsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-20">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center h-[70vh]">
            <div className="text-center">
              <div className="w-8 h-[1px] bg-[#d4af37] mx-auto mb-6 animate-pulse"></div>
              <p className="text-[#d4af37] text-xs tracking-[0.5em]">AUTHORIZING ACCESS...</p>
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
          <div className="flex-1 max-w-7xl mx-auto px-8 py-16">
            <div className="flex justify-between items-end mb-12">
              <div>
                <span className="block text-[#d4af37] text-xs tracking-[0.5em]">INSTITUTIONAL CONTROL</span>
                <h1 className="serif-font text-6xl italic tracking-tighter">Inventory Vault</h1>
              </div>
              <div className="flex gap-4">
                {hasRight('PRD_ADD') && (
                  <button onClick={openAddModal} className="border border-[#d4af37] text-[#d4af37] px-10 py-4 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all">
                    + ADD NEW ASSET
                  </button>
                )}
                <button onClick={fetchProducts} className="border border-white/30 px-8 py-4 text-xs tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition">REFRESH</button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <input 
                type="text" 
                placeholder="SEARCH ASSETS..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border border-white/20 px-6 py-4 text-sm tracking-widest focus:border-[#d4af37] outline-none placeholder:text-white/40"
              />
              <select 
                value={stockFilter} 
                onChange={(e) => setStockFilter(e.target.value)}
                className="bg-black border border-white/20 px-6 py-4 text-sm tracking-widest focus:border-[#d4af37] outline-none"
              >
                <option value="all">ALL STOCK</option>
                <option value="inStock">IN STOCK (≥1)</option>
                <option value="lowStock">LOW STOCK (0-3)</option>
              </select>
            </div>

            {error && <div className="bg-red-900/20 border border-red-500/50 p-6 mb-10 text-red-400">{error}</div>}

            <div className="border border-white/10 overflow-hidden rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-black/70 border-b border-white/10">
                  <tr className="text-xs tracking-widest text-white/60">
                    <th className="px-8 py-6">ID</th>
                    <th className="px-8 py-6">NAME</th>
                    <th className="px-8 py-6">DESCRIPTION</th>
                    <th className="px-8 py-6">UNIT</th>
                    <th className="px-8 py-6">STOCK</th>
                    <th className="px-8 py-6">IMAGE</th>
                    <th className="px-8 py-6">CURRENT PRICE</th>
                    {canViewAudit && <th className="px-8 py-6">CREATED</th>}
                    <th className="px-8 py-6 w-64 text-center">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(() => {
                    const filtered = products
                      .filter(p => 
                        (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .filter(p => {
                        if (stockFilter === 'inStock') return (p.stock || 0) >= 1;
                        if (stockFilter === 'lowStock') return (p.stock || 0) >= 0 && (p.stock || 0) <= 3;
                        return true;
                      });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={canViewAudit ? 9 : 8} className="px-8 py-16 text-center text-white/50">
                            No assets match your search or filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(p => {
                      const isExpanded = expandedRows.has(p.prodcode);
                      const currPrice = currentPrices[p.prodcode] || 0;
                      return (
                        <React.Fragment key={p.prodcode}>
                          <tr className="hover:bg-white/5 transition-all duration-200">
                            <td className="px-8 py-8 font-mono text-sm">{p.prodcode}</td>
                            <td className="px-8 py-8 font-medium">{p.name || '—'}</td>
                            <td className="px-8 py-8 text-sm max-w-xs truncate text-white/80">{p.description || '—'}</td>
                            <td className="px-8 py-8 text-xs uppercase tracking-widest text-white/60">{p.unit || '—'}</td>
                            <td className="px-8 py-8 font-mono text-sm text-emerald-400">{p.stock || 0}</td>
                            <td className="px-8 py-8">
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} className="w-12 h-12 object-cover border border-white/20 rounded" />
                              ) : '—'}
                            </td>
                            <td className="px-8 py-8 text-[#d4af37] font-medium">₱{Number(currPrice || p.price || 0).toLocaleString()}</td>
                            {canViewAudit && <td className="px-8 py-8 text-xs text-white/50">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>}
                            
                            <td className="px-8 py-8 text-center">
                              <div className="flex flex-col items-center gap-3">
                                {/* PRICE HISTORY */}
                                <button 
                                  onClick={() => toggleRow(p.prodcode)} 
                                  className="text-xs text-white/60 hover:text-white tracking-widest transition-colors whitespace-nowrap"
                                >
                                  {isExpanded ? 'HIDE HISTORY' : 'PRICE HISTORY'}
                                </button>

                                {/* EDIT & DELETE - Centered */}
                                <div className="flex items-center gap-6">
                                  {hasRight('PRD_EDIT') && (
                                    <button 
                                      onClick={() => openEditModal(p)} 
                                      className="text-xs text-[#d4af37] hover:text-white tracking-widest transition-colors"
                                    >
                                      EDIT
                                    </button>
                                  )}
                                  {hasRight('PRD_DEL') && (
                                    <button 
                                      onClick={() => openDeleteDialog(p)} 
                                      className="text-xs text-red-400 hover:text-red-500 tracking-widest transition-colors"
                                    >
                                      DELETE
                                    </button>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="bg-black/40">
                              <td colSpan={canViewAudit ? 9 : 8} className="px-8 py-8">
                                <div className="pl-4 border-l border-white/20">
                                  <div className="flex justify-between items-center mb-6">
                                    <div>
                                      <span className="text-xs tracking-[0.5em] text-white/50">PRICE HISTORY</span>
                                      <div className="text-lg text-white mt-1">{p.name}</div>
                                    </div>
                                    {hasRight('PRICE_ADD') && (
                                      <div className="flex gap-3 items-end">
                                        <input type="date" value={priceForm.effDate} onChange={e => setPriceForm({ ...priceForm, effDate: e.target.value })} className="bg-transparent border-b border-white/20 text-sm pb-2 outline-none focus:border-[#d4af37]" />
                                        <input type="number" step="0.01" placeholder="Unit Price" value={priceForm.unitPrice} onChange={e => setPriceForm({ ...priceForm, unitPrice: e.target.value })} className="bg-transparent border-b border-white/20 text-sm pb-2 w-32 outline-none focus:border-[#d4af37]" />
                                        <button onClick={() => handleAddPriceEntry(p.prodcode)} className="px-6 py-2 text-xs border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition">ADD ENTRY</button>
                                      </div>
                                    )}
                                  </div>
                                  <div className="border border-white/10">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-white/10 text-xs text-white/50">
                                          <th className="px-6 py-4 text-left">EFFECTIVE DATE</th>
                                          <th className="px-6 py-4 text-right">UNIT PRICE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(priceHistories[p.prodcode] || []).length > 0 ? priceHistories[p.prodcode].map((entry) => (
                                          <tr key={entry.effdate} className="border-b border-white/10 last:border-0">
                                            <td className="px-6 py-4 text-white/70">{new Date(entry.effdate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right text-[#d4af37]">₱{Number(entry.unitprice).toLocaleString()}</td>
                                          </tr>
                                        )) : (
                                          <tr><td colSpan="2" className="px-6 py-8 text-center text-white/40 text-xs">No price history yet.</td></tr>
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
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modals (unchanged) */}
        {/* Add Modal, Edit Modal, Delete Dialog - same as before */}
        {/* ... (Keep your existing modal code here) ... */}

      </div>
    </ErrorBoundary>
  );
}