/* eslint-disable react-hooks/set-state-in-effect */
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
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

  const [formData, setFormData] = useState({ name: '', description: '', unit: 'ea' });
  const [priceForm, setPriceForm] = useState({ effDate: '', unitPrice: '' });

  const { user } = useAuth();
  // PR-02: Destructuring rights helpers
  const { hasRight, loading: rightsLoading } = useRights();

  // PR-02: Derived state for "Stamp" column visibility (Admin/SuperAdmin only)
  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdminOrSuper = userType === 'ADMIN' || userType === 'SUPERADMIN';

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProducts(userType);
      setProducts(data);

      const prices = {};
      for (const p of data) {
        prices[p.id] = await getCurrentPrice(p.id);
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

  const toggleRow = useCallback(async (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        if (!priceHistories[id]) {
          getPriceHistory(id).then(history => {
            setPriceHistories(p => ({ ...p, [id]: history }));
          });
        }
      }
      return newSet;
    });
  }, [priceHistories]);

  const openAddModal = () => {
    if (!hasRight('PRD_ADD')) return; 
    setFormData({ name: '', description: '', unit: 'ea' });
    setShowAddModal(true);
  };

  const openEditModal = (p) => {
    if (!hasRight('PRD_EDIT')) return;
    setSelectedProduct(p);
    setFormData({ 
      name: p.name || '', 
      description: p.description || '', 
      unit: p.unit || 'ea' 
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
    } catch (err) {
      alert('Add failed: ' + err.message);
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    try {
      await updateProduct(selectedProduct.id, formData);
      setShowEditModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  const handleSoftDelete = async () => {
    try {
      await softDeleteProduct(selectedProduct.id);
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleAddPriceEntry = async (productId) => {
    if (!hasRight('PRICE_ADD')) return;
    if (!priceForm.effDate || !priceForm.unitPrice) return alert('Date and price required');
    try {
      await addPriceEntry(productId, priceForm.effDate, priceForm.unitPrice);
      const h = await getPriceHistory(productId);
      setPriceHistories(prev => ({ ...prev, [productId]: h }));
      const np = await getCurrentPrice(productId);
      setCurrentPrices(prev => ({ ...prev, [productId]: np }));
      setPriceForm({ effDate: '', unitPrice: '' });
    } catch (err) {
      alert('Price entry failed: ' + err.message);
    }
  };

  // PR-02: Show professional loading state while rights are being fetched
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
                {/* PR-02: Add Button Gating */}
                {hasRight('PRD_ADD') && (
                  <button onClick={openAddModal} className="border border-[#d4af37] text-[#d4af37] px-10 py-4 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all">
                    + ADD NEW ASSET
                  </button>
                )}
                <button onClick={fetchProducts} className="border border-white/30 px-8 py-4 text-xs tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition">REFRESH</button>
              </div>
            </div>

            {error && <div className="bg-red-900/20 border border-red-500/50 p-6 mb-10 text-red-400">{error}</div>}

            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-black/50 border-b border-white/10">
                  <tr className="text-xs tracking-widest text-white/60">
                    <th className="px-8 py-6">ID</th>
                    <th className="px-8 py-6">NAME</th>
                    <th className="px-8 py-6">DESCRIPTION</th>
                    <th className="px-8 py-6">UNIT</th>
                    <th className="px-8 py-6">CURRENT PRICE</th>
                    {/* PR-02: Stamp Column Header Gating */}
                    {isAdminOrSuper && <th className="px-8 py-6">CREATED</th>}
                    <th className="px-8 py-6 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {products.length === 0 ? (
                    <tr>
                     {/* If Admin: colSpan is 7 (ID, Name, Desc, Unit, Price, Created, Actions)
                        If User: colSpan is 6 (Created is hidden)
                     */}
                     <td colSpan={isAdminOrSuper ? 7 : 6} className="px-8 py-16 text-center text-white/50">
                       No products found.
                     </td>
                    </tr>
                  ) : (
                    products.map(p => {
                      const isExpanded = expandedRows.has(p.id);
                      const currPrice = currentPrices[p.id] || 0;
                      return (
                        <React.Fragment key={p.id}>
                          <tr className="hover:bg-white/5 transition">
                            <td className="px-8 py-8 font-mono text-sm">{p.id}</td>
                            <td className="px-8 py-8">{p.name || '—'}</td>
                            <td className="px-8 py-8 text-sm max-w-xs truncate">{p.description || '—'}</td>
                            <td className="px-8 py-8 text-xs uppercase tracking-widest text-white/60">{p.unit || '—'}</td>
                            <td className="px-8 py-8 text-[#d4af37]">₱{Number(currPrice).toLocaleString()}</td>
                            {/* PR-02: Stamp Column Data Gating */}
                            {isAdminOrSuper && <td className="px-8 py-8 text-xs text-white/50">{p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</td>}
                            <td className="px-8 py-8 text-right">
                              <div className="flex items-center justify-end gap-4">
                                <button onClick={() => toggleRow(p.id)} className="text-xs text-white/50 hover:text-white tracking-widest">
                                  {isExpanded ? 'HIDE HISTORY' : 'PRICE HISTORY'}
                                </button>
                                {/* PR-02: Edit Button Gating */}
                                {hasRight('PRD_EDIT') && <button onClick={() => openEditModal(p)} className="text-white/70 hover:text-white text-xs tracking-widest">EDIT</button>}
                                {/* PR-02: Delete Button Gating */}
                                {hasRight('PRD_DEL') && <button onClick={() => openDeleteDialog(p)} className="text-red-400/70 hover:text-red-400 text-xs tracking-widest">DELETE</button>}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-black/40">
                              {/* Update this colSpan too! */}
                              <td colSpan={isAdminOrSuper ? 7 : 6} className="px-8 py-8">
                                {/* Price history content */}
                                <div className="pl-4 border-l border-white/20">
                                  <div className="flex justify-between items-center mb-6">
                                    <div>
                                      <span className="text-xs tracking-[0.5em] text-white/50">PRICE HISTORY</span>
                                      <div className="text-lg text-white mt-1">{p.name}</div>
                                    </div>
                                    {/* PR-02: Price Entry Form Gating */}
                                    {hasRight('PRICE_ADD') && (
                                      <div className="flex gap-3 items-end">
                                        <input type="date" value={priceForm.effDate} onChange={e => setPriceForm({ ...priceForm, effDate: e.target.value })} className="bg-transparent border-b border-white/20 text-sm pb-2 outline-none focus:border-[#d4af37]" />
                                        <input type="number" step="0.01" placeholder="Unit Price" value={priceForm.unitPrice} onChange={e => setPriceForm({ ...priceForm, unitPrice: e.target.value })} className="bg-transparent border-b border-white/20 text-sm pb-2 w-32 outline-none focus:border-[#d4af37]" />
                                        <button onClick={() => handleAddPriceEntry(p.id)} className="px-6 py-2 text-xs border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black transition">ADD ENTRY</button>
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
                                        {(priceHistories[p.id] || []).length > 0 ? priceHistories[p.id].map((entry, idx) => (
                                          <tr key={idx} className="border-b border-white/10 last:border-0">
                                            <td className="px-6 py-4 text-white/70">{new Date(entry.effDate).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right text-[#d4af37]">₱{Number(entry.unitPrice).toLocaleString()}</td>
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
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ==================== MODALS (Gated) ==================== */}
        {showAddModal && hasRight('PRD_ADD') && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-10 rounded-none">
              <h2 className="serif-font text-4xl italic mb-8">New Asset</h2>
              <form onSubmit={handleAddProduct} className="space-y-8">
                <input type="text" placeholder="NAME" required value={formData.name} className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]" onChange={e=>setFormData({...formData, name:e.target.value})} />
                <textarea placeholder="DESCRIPTION" required value={formData.description} className="w-full bg-transparent border-b border-white/20 pb-3 h-28 outline-none focus:border-[#d4af37]" onChange={e=>setFormData({...formData, description:e.target.value})} />
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">UNIT</label>
                  <select value={formData.unit} onChange={e=>setFormData({...formData, unit:e.target.value})} className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]">
                    <option value="ea">EA (Each)</option><option value="pc">PC (Piece)</option><option value="mtr">MTR (Meter)</option><option value="pkg">PKG (Package)</option><option value="ltr">LTR (Liter)</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={()=>setShowAddModal(false)} className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition">CANCEL</button>
                  <button type="submit" className="flex-1 py-4 bg-[#d4af37] text-black font-medium tracking-widest hover:bg-white transition">CREATE ASSET</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditModal && selectedProduct && hasRight('PRD_EDIT') && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-10 rounded-none">
              <h2 className="serif-font text-4xl italic mb-8">Edit Asset</h2>
              <form onSubmit={handleEditProduct} className="space-y-8">
                <div><label className="text-xs tracking-widest text-white/50 block mb-1">NAME</label><div className="text-lg font-mono text-white/70">{formData.name}</div></div>
                <textarea placeholder="DESCRIPTION" required value={formData.description} className="w-full bg-transparent border-b border-white/20 pb-3 h-28 outline-none focus:border-[#d4af37]" onChange={e=>setFormData({...formData, description:e.target.value})} />
                <div>
                  <label className="text-xs tracking-widest text-white/50 block mb-2">UNIT</label>
                  <select value={formData.unit} onChange={e=>setFormData({...formData, unit:e.target.value})} className="w-full bg-transparent border-b border-white/20 text-lg outline-none focus:border-[#d4af37] bg-black">
                    <option value="ea">EA</option><option value="pc">PC</option><option value="mtr">MTR</option><option value="pkg">PKG</option><option value="ltr">LTR</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={()=>{setShowEditModal(false);setSelectedProduct(null);}} className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition">CANCEL</button>
                  <button type="submit" className="flex-1 py-4 bg-[#d4af37] text-black font-medium tracking-widest hover:bg-white transition">SAVE CHANGES</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteDialog && selectedProduct && hasRight('PRD_DEL') && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-sm p-10 text-center">
              <div className="text-6xl mb-6 text-red-400">⚠</div>
              <h3 className="text-2xl mb-4">Delete Asset?</h3>
              <p className="text-white/70 mb-8">This will soft-delete <span className="text-white font-medium">{selectedProduct.name || selectedProduct.id}</span>. It can be recovered from Deleted Items.</p>
              <div className="flex gap-4">
                <button onClick={()=>{setShowDeleteDialog(false);setSelectedProduct(null);}} className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition">CANCEL</button>
                <button onClick={handleSoftDelete} className="flex-1 py-4 bg-red-600 text-white font-medium tracking-widest hover:bg-red-700 transition">YES, DELETE</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}