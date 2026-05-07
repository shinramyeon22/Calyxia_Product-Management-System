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

  const [formData, setFormData] = useState({ prodcode: '', description: '', unit: 'ea', price: '', stock: 0, image_url: '' });
  const [priceForm, setPriceForm] = useState({ effDate: '', unitPrice: '' });
  const [savingAsset, setSavingAsset] = useState(false);
  
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
      setError(err.message || 'Failed to load Product Inventory');
    } finally {
      setLoading(false);
    }
  }, [userType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ==================== BODY SCROLL LOCK FOR FIXED MODALS ====================
  useEffect(() => {
    const isAnyModalOpen = showEditModal || showDeleteDialog || showAddModal;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'visible';
    }
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, [showEditModal, showDeleteDialog, showAddModal]);

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
    setFormData({ prodcode: '', description: '', unit: 'ea', price: '', stock: 0, image_url: '' });
    setShowAddModal(true);
  };

  const openEditModal = (p) => {
    if (!hasRight('PRD_EDIT')) return;
    setSelectedProduct(p);
    setFormData({
      prodcode: p.prodcode || '',
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
    if (!hasRight('PRICE_ADD')) return;
    if (!priceForm.effDate || !priceForm.unitPrice) return showToast('Date and price required', 'error');
    try {
      await addPriceEntry(prodcode, priceForm.effDate, priceForm.unitPrice, user?.id);
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

  // ==================== IMAGE UPLOAD HANDLER (FIXED) ====================
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target.result;
      setFormData(prev => ({ ...prev, image_url: base64String }));

      const previewId = type === 'edit' ? 'editImagePreview' : 'addImagePreview';
      const preview = document.getElementById(previewId);
      if (preview) preview.src = base64String;
    };
    reader.readAsDataURL(file);
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
            <div className="flex justify-start items-end mb-12 gap-8">
              <div className="flex gap-4">
                {hasRight('PRD_ADD') && (
                  <button onClick={openAddModal} className="border border-[#d4af37] text-[#d4af37] px-10 py-4 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all">
                    + ADD NEW ASSET
                  </button>
                )}
                <button onClick={fetchProducts} className="border-2 border-[#d4af37] text-[#d4af37] px-8 py-4 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition">REFRESH</button>
              </div>
              <div>
                <span className="block text-[#d4af37] text-xs tracking-[0.5em]">INSTITUTIONAL CONTROL</span>
                <h1 className="serif-font text-6xl italic tracking-tighter">Product Vault</h1>
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

            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/50 border-b border-white/10">
                  <tr className="text-xs tracking-widest text-white/60">
                    <th className="px-8 py-6">ID</th>
                    <th className="px-8 py-6">DESCRIPTION</th>
                    <th className="px-8 py-6">UNIT</th>
                    <th className="px-8 py-6">STOCK</th>
                    <th className="px-8 py-6">IMAGE</th>
                    <th className="px-8 py-6">CURRENT PRICE</th>
                    {canViewAudit && <th className="px-8 py-6">CREATED</th>}
                    <th className="px-8 py-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {(() => {
                    const filtered = products
                      .filter(p =>
                        (p.prodcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                          <td colSpan={canViewAudit ? 8 : 7} className="px-8 py-16 text-center text-white/50">
                            No assets match your search or filter.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(p => {
                      const isExpanded = expandedRows.has(p.prodcode);
                      const currPrice = currentPrices[p.prodcode];
                      return (
                        <React.Fragment key={p.prodcode}>
                          <tr className="hover:bg-white/5 transition">
                            <td className="px-8 py-8 font-mono text-sm">{p.prodcode}</td>
                            <td className="px-8 py-8 text-sm max-w-xs truncate">{p.description || '—'}</td>
                            <td className="px-8 py-8 text-xs uppercase tracking-widest text-white/60">{p.unit || '—'}</td>
                            <td className="px-8 py-8 font-mono text-sm text-emerald-400">{p.stock || 0}</td>
                            <td className="px-8 py-8">
                              {p.image_url ? (
                                <img src={p.image_url} alt="" className="w-12 h-12 object-cover border border-white/20" />
                              ) : '—'}
                            </td>
                            <td className="px-8 py-8 text-[#d4af37]">₱{Number((currPrice ?? p.price) ?? 0).toLocaleString()}</td>
                            {canViewAudit && <td className="px-8 py-8 text-xs text-white/50">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>}
                            <td className="px-8 py-8 text-right">
                              <div className="flex items-center justify-end gap-4">
                                <button onClick={() => toggleRow(p.prodcode)} className="text-xs text-white/50 hover:text-white tracking-widest">
                                  {isExpanded ? 'HIDE HISTORY' : 'PRICE HISTORY'}
                                </button>
                                {hasRight('PRD_EDIT') && <button onClick={() => openEditModal(p)} className="text-white/70 hover:text-white text-xs tracking-widest">EDIT</button>}
                                
                                {/* DELETE BUTTON - Only SUPERADMIN (PRD_DEL) */}
                                {hasRight('PRD_DEL') && (
                                  <button onClick={() => openDeleteDialog(p)} className="text-red-400/70 hover:text-red-400 text-xs tracking-widest">DELETE</button>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-black/40">
                              <td colSpan={canViewAudit ? 8 : 7} className="px-8 py-8">
                                <div className="pl-4 border-l border-white/20">
                                  <div className="flex justify-between items-center mb-6">
                                    <div>
                                      <span className="text-xs tracking-[0.5em] text-white/50">PRICE HISTORY</span>
                                      <div className="text-lg text-white mt-1">{p.description}</div>
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

        {/* ==================== MODALS ==================== */}
        
        {/* ==================== ADD MODAL (FIXED + RESPONSIVE) ==================== */}
        {showAddModal && hasRight('PRD_ADD') && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 sm:p-6 overflow-y-auto" onClick={() => setShowAddModal(false)}>
            <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md sm:max-w-lg p-6 sm:p-10 rounded-none relative max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white text-3xl">×</button>
              
              <div className="text-center mb-10">
                <div className="text-[#d4af37] text-xs tracking-[0.5em] mb-2">NEW INSTITUTIONAL ASSET</div>
                <h2 className="serif-font text-5xl italic tracking-tighter">Create Asset</h2>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-8">
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">PRODUCT CODE (MAX 6)</label>
                  <input type="text" placeholder="EG. XX0001" required maxLength={6} value={formData.prodcode} onChange={e=>setFormData({...formData, prodcode:e.target.value.toUpperCase()})} className="w-full bg-transparent border-b border-white/20 pb-3 text-lg font-mono outline-none focus:border-[#d4af37]" />
                </div>
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">DESCRIPTION (MAX 30)</label>
                  <textarea placeholder="SHORT PRODUCT NAME OR LABEL" required maxLength={30} value={formData.description} onChange={e=>setFormData({...formData, description:e.target.value})} className="w-full bg-transparent border-b border-white/20 pb-3 h-24 outline-none focus:border-[#d4af37]" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs tracking-widest text-white/50 block mb-2">UNIT</label>
                    <select value={formData.unit} onChange={e=>setFormData({...formData, unit:e.target.value})} className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]">
                      <option value="ea">EA</option><option value="pc">PC</option><option value="mtr">MTR</option><option value="pkg">PKG</option><option value="ltr">LTR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs tracking-widest text-white/50 block mb-2">STOCK</label>
                    <input type="number" value={formData.stock} onChange={e=>setFormData({...formData, stock:parseInt(e.target.value)||0})} className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">PRICE (₱)</label>
                  <input type="number" step="0.01" value={formData.price} onChange={e=>setFormData({...formData, price:e.target.value})} className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]" />
                </div>

                {/* ========== FIXED IMAGE SECTION (ADD) ========== */}
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">PRODUCT IMAGE</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        id="addImagePreview" 
                        src={formData.image_url || 'https://via.placeholder.com/80x80/111/ddd?text=No+Image'} 
                        className="w-16 h-16 object-cover border border-white/20 rounded" 
                        alt="Preview" 
                      />
                    </div>
                    <div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById('addImageUpload').click()}
                        className="px-5 py-2 text-xs border border-white/30 hover:border-[#d4af37] hover:text-[#d4af37] transition"
                      >
                        UPLOAD NEW IMAGE
                      </button>
                      <input 
                        type="file" 
                        id="addImageUpload" 
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'add')}
                      />
                      <p className="text-[10px] text-white/40 mt-1">JPG or PNG • Max 2MB</p>
                    </div>
                  </div>
                </div>
                {/* ========== END FIXED IMAGE SECTION ========== */}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition">CANCEL</button>
                  <button type="submit" disabled={savingAsset} className="flex-1 py-4 bg-[#d4af37] text-black font-medium tracking-widest hover:bg-white transition disabled:opacity-40 disabled:pointer-events-none">{savingAsset ? 'SAVING…' : 'CREATE ASSET'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== EDIT MODAL - ON TOP + RESPONSIVE ==================== */}
        {showEditModal && selectedProduct && hasRight('PRD_EDIT') && (
          <div 
            className="fixed inset-0 bg-black/95 flex items-start justify-center z-[100] pt-12 p-4 sm:p-6" 
            onClick={() => {setShowEditModal(false); setSelectedProduct(null);}}
          >
            <div 
              className="bg-[#0a0a0c] border border-white/10 w-full max-w-md sm:max-w-lg p-6 sm:p-10 rounded-none relative shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => {setShowEditModal(false); setSelectedProduct(null);}} 
                className="absolute top-8 right-8 text-white/50 hover:text-white text-3xl transition-colors"
              >
                ×
              </button>
              
              <div className="text-center mb-10">
                <div className="text-[#d4af37] text-xs tracking-[0.5em] mb-2">EDIT INSTITUTIONAL ASSET</div>
                <h2 className="serif-font text-5xl italic tracking-tighter">Update Records</h2>
              </div>

              <form onSubmit={handleEditProduct} className="space-y-8">
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-1">PRODUCT CODE</label>
                  <div className="text-lg font-mono text-white/70">{formData.prodcode}</div>
                </div>
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">DESCRIPTION (MAX 30)</label>
                  <textarea 
                    placeholder="SHORT PRODUCT NAME OR LABEL" 
                    required 
                    maxLength={30} 
                    value={formData.description} 
                    onChange={e=>setFormData({...formData, description:e.target.value})} 
                    className="w-full bg-transparent border-b border-white/20 pb-3 h-24 outline-none focus:border-[#d4af37]" 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs tracking-widest text-white/50 block mb-2">UNIT</label>
                    <select 
                      value={formData.unit} 
                      onChange={e=>setFormData({...formData, unit:e.target.value})} 
                      className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]"
                    >
                      <option value="ea">EA</option>
                      <option value="pc">PC</option>
                      <option value="mtr">MTR</option>
                      <option value="pkg">PKG</option>
                      <option value="ltr">LTR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs tracking-widest text-white/50 block mb-2">STOCK</label>
                    <input 
                      type="number" 
                      value={formData.stock} 
                      onChange={e=>setFormData({...formData, stock:parseInt(e.target.value)||0})} 
                      className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">PRICE (₱)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={formData.price} 
                    onChange={e=>setFormData({...formData, price:e.target.value})} 
                    className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]" 
                  />
                </div>

                {/* ========== FIXED IMAGE SECTION (EDIT) ========== */}
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">PRODUCT IMAGE</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        id="editImagePreview" 
                        src={formData.image_url || 'https://via.placeholder.com/80x80/111/ddd?text=No+Image'} 
                        className="w-16 h-16 object-cover border border-white/20 rounded" 
                        alt="Preview" 
                      />
                    </div>
                    <div>
                      <button 
                        type="button"
                        onClick={() => document.getElementById('editImageUpload').click()}
                        className="px-5 py-2 text-xs border border-white/30 hover:border-[#d4af37] hover:text-[#d4af37] transition"
                      >
                        UPLOAD NEW IMAGE
                      </button>
                      <input 
                        type="file" 
                        id="editImageUpload" 
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, 'edit')}
                      />
                      <p className="text-[10px] text-white/40 mt-1">JPG or PNG • Max 2MB</p>
                    </div>
                  </div>
                </div>
                {/* ========== END FIXED IMAGE SECTION ========== */}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={()=>{setShowEditModal(false);setSelectedProduct(null);}} 
                    className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-4 bg-[#d4af37] text-black font-medium tracking-widest hover:bg-white transition"
                  >
                    SAVE CHANGES
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ==================== DELETE DIALOG - FIXED POSITION (UPPER PAGE) ==================== */}
        {showDeleteDialog && selectedProduct && hasRight('PRD_DEL') && (
          <div 
            className="fixed inset-0 bg-black/95 flex items-start justify-center z-[100] pt-24 p-6" 
            onClick={() => {setShowDeleteDialog(false);setSelectedProduct(null);}}
          >
            <div 
              className="bg-[#0a0a0c] border border-white/10 w-full max-w-sm p-10 text-center shadow-2xl" 
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-6 text-red-400">⚠</div>
              <h3 className="text-2xl mb-4">Delete Asset?</h3>
              <p className="text-white/70 mb-8">
                This will soft-delete <span className="text-white font-medium">{selectedProduct.prodcode}</span>. It can be recovered from Deleted Items.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={()=>{setShowDeleteDialog(false);setSelectedProduct(null);}} 
                  className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleSoftDelete} 
                  className="flex-1 py-4 bg-red-600 text-white font-medium tracking-widest hover:bg-red-700 transition"
                >
                  YES, DELETE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}