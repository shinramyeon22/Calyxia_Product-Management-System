import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { enrichProductsWithCurrentPrice, getPriceHistory, addPriceEntry, updateProduct } from '../services/productService';
import Navbar from '../components/Navbar';
import { Link, useSearchParams } from 'react-router-dom';
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

  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 1. Initialize state from URL
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'listing' ? 'listing' : 'products'
  );

  // 2. Sync state when the URL changes (Crucial for Sidebar clicks)
  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'listing' ? 'listing' : 'products');
  }, [searchParams]);

  useEffect(() => {
  const tabFromUrl = searchParams.get('tab') === 'listing' ? 'listing' : 'products';
  if (activeTab !== tabFromUrl) {
    setActiveTab(tabFromUrl);
  }
}, [searchParams]);


  useEffect(() => {
    async function getProducts() {
      try {
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .order('id', { ascending: true });

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
      const { data } = await supabase.from('product').select('*').order('id', { ascending: true });
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
      setPriceForm({ effDate: '', unitPrice: '' });
      showToast('Price entry added!', 'success');
    } catch (err) {
      showToast('Failed to add entry: ' + err.message, 'error');
    }
  };

  const filteredProducts = products.filter(p =>
    (p.prodcode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">
        

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="serif-font text-6xl md:text-7xl italic tracking-tighter">
              {activeTab === 'products' ? 'Products' : 'Product Listing'}
            </h1>
            <p className="text-white/60 mt-2">
              {activeTab === 'products' 
                ? 'Manage product catalogue' 
                : 'Current prices for all active assets'}
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={exportToCSV} 
              disabled={!filteredProducts.length}
              className="flex items-center gap-2 bg-[#d4af37] hover:bg-white text-black text-xs tracking-[0.15em] px-6 py-3 rounded transition-all"
            >
              EXPORT CSV
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center gap-2 border border-white/20 hover:bg-white/5 text-xs tracking-[0.15em] px-6 py-3 rounded transition-all"
            >
              REFRESH
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-4 bg-black/50 border border-white/10 px-6 py-4 rounded-2xl">
            <div className="text-4xl">📦</div>
            <div>
              <div className="text-3xl font-mono text-[#d4af37]">{products.length}</div>
              <div className="text-xs tracking-widest text-white/50">ACTIVE PRODUCTS</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input 
              type="text" 
              placeholder="Search by code, description, or unit..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full bg-black border border-white/10 pl-12 py-4 text-sm focus:border-[#d4af37] outline-none placeholder:text-white/40 rounded-2xl"
            />
            <div className="absolute left-5 top-4 text-white/40">🔍</div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="text-[#d4af37] text-xs tracking-[0.5em] animate-pulse">LOADING CATALOGUE...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-white/50">No products found.</div>
        ) : (
          <div className="border border-white/10 overflow-hidden rounded-2xl shadow-2xl">
            <table className="w-full text-sm">
              <thead className="bg-black/70 border-b border-white/10">
                <tr className="text-xs tracking-[0.2em] text-white/60">
                  <th className="px-8 py-5 text-left font-medium">PRODUCT CODE</th>
                  <th className="px-8 py-5 text-left font-medium">DESCRIPTION</th>
                  <th className="px-8 py-5 text-center font-medium">UNIT</th>
                  
                  {activeTab === 'products' ? (
                    <>
                      <th className="px-8 py-5 text-center font-medium">STATUS</th>
                      <th className="px-8 py-5 text-center font-medium">ACTIONS</th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-5 text-right font-medium">CURRENT PRICE</th>
                      <th className="px-8 py-5 text-left font-medium">EFFECTIVE DATE</th>
                      <th className="px-8 py-5 text-center font-medium">ACTIONS</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProducts.map((p) => (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-white/5 transition-all duration-200">
                      <td className="px-8 py-6 font-mono text-sm text-[#d4af37]">{p.prodcode}</td>
                      <td className="px-8 py-6 text-white">{p.description}</td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-block px-3 py-1 text-xs tracking-widest bg-white/5 rounded-full">{p.unit}</span>
                      </td>
                      {activeTab === 'products' ? (
                        <>
                          <td className="px-8 py-6 text-center">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs tracking-widest ${p.record_status === 'A' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                              {p.record_status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-3">
                              <Link to={`/product/${p.id}`} className="px-4 py-2 text-xs border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded-lg transition">VIEW</Link>
                              <button onClick={() => openEditModal(p)} className="px-4 py-2 text-xs border border-white/20 text-white/70 hover:border-white/40 hover:text-white rounded-lg transition">EDIT</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-8 py-6 text-right font-medium text-[#d4af37]">₱{Number(p.price || 0).toLocaleString()}</td>
                          <td className="px-8 py-6 text-sm text-white/60">{p.effective_date ? new Date(p.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-3">
                              <button onClick={() => openHistoryModal(p)} className="px-4 py-2 text-xs border border-white/20 text-white/70 hover:border-[#d4af37] hover:text-[#d4af37] rounded-lg transition">HISTORY</button>
                              <Link to={`/product/${p.id}`} className="px-4 py-2 text-xs border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black rounded-lg transition">VIEW</Link>
                            </div>
                          </td>
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
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="text-[#d4af37] text-xs tracking-[0.5em]">EDIT ASSET</div>
                <h2 className="serif-font text-3xl italic">Update Records</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-white/50 hover:text-white text-3xl">×</button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs tracking-widest text-white/50 block mb-2">PRODUCT CODE</label>
                <div className="font-mono text-lg text-white/80 bg-black/50 px-4 py-3 rounded-xl border border-white/10">
                  {selectedProduct.prodcode}
                </div>
              </div>

              <div>
                <label className="text-xs tracking-widest text-white/50 block mb-2">DESCRIPTION</label>
                <textarea 
                  value={editForm.description} 
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                  className="w-full bg-black border border-white/10 px-4 py-4 rounded-xl text-white focus:border-[#d4af37] outline-none h-24 resize-y"
                />
              </div>

              <div>
                <label className="text-xs tracking-widest text-white/50 block mb-3">UNIT</label>
                <div className="flex flex-wrap gap-2">
                  {['pc', 'ea', 'mtr', 'pkg', 'ltr'].map((u) => (
                    <button 
                      key={u} 
                      onClick={() => setEditForm({ ...editForm, unit: u })} 
                      className={`px-5 py-2 text-sm rounded-full border transition-all ${editForm.unit === u ? 'bg-[#d4af37] text-black border-[#d4af37]' : 'border-white/20 text-white/70 hover:border-white/40'}`}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-10">
              <button 
                onClick={() => setShowEditModal(false)} 
                className="flex-1 py-4 border border-white/20 hover:bg-white/5 text-sm tracking-widest rounded-2xl transition"
              >
                CANCEL
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 py-4 bg-[#d4af37] text-black text-sm tracking-widest font-medium rounded-2xl hover:bg-white transition"
              >
                SAVE CHANGES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price History Modal */}
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-black px-8 py-6 flex justify-between items-center border-b border-white/10">
              <div>
                <div className="text-[#d4af37] text-xs tracking-[0.5em]">VALUATION ARCHIVE</div>
                <div className="font-mono text-lg text-white mt-1">{selectedProduct.prodcode}</div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-white/50 hover:text-white text-3xl">×</button>
            </div>

            <div className="p-8">
              <div className="bg-black/50 border border-white/10 rounded-2xl p-6 mb-8">
                <div className="text-xs tracking-widest text-white/50">CURRENT PRICE</div>
                <div className="text-5xl font-mono text-[#d4af37] mt-2">
                  ₱{Number(selectedProduct.price || 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/40 mt-1">
                  Effective {selectedProduct.effective_date ? new Date(selectedProduct.effective_date).toLocaleDateString() : '—'}
                </div>
              </div>

              <div className="mb-8">
                <div className="text-xs tracking-widest text-white/50 mb-3">ADD NEW ENTRY</div>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={priceForm.effDate}
                    onChange={(e) => setPriceForm({ ...priceForm, effDate: e.target.value })}
                    className="flex-1 bg-black border border-white/10 px-4 py-3 rounded-2xl text-sm focus:border-[#d4af37] outline-none"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price"
                    value={priceForm.unitPrice}
                    onChange={(e) => setPriceForm({ ...priceForm, unitPrice: e.target.value })}
                    className="w-32 bg-black border border-white/10 px-4 py-3 rounded-2xl text-sm focus:border-[#d4af37] outline-none"
                  />
                  <button
                    onClick={handleAddPriceEntry}
                    className="px-6 bg-[#d4af37] text-black rounded-2xl hover:bg-white transition text-sm font-medium whitespace-nowrap"
                  >
                    ADD
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs tracking-widest text-white/50 mb-3">PRICE HISTORY ({(priceHistories[selectedProduct.prodcode] || []).length})</div>
                <div className="border border-white/10 rounded-2xl overflow-hidden max-h-[240px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-black/60 sticky top-0">
                      <tr className="text-xs text-white/50">
                        <th className="px-6 py-4 text-left">EFFECTIVE DATE</th>
                        <th className="px-6 py-4 text-right">UNIT PRICE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {(priceHistories[selectedProduct.prodcode] || []).length > 0 ? (
                        priceHistories[selectedProduct.prodcode].map((entry, idx) => (
                          <tr key={idx} className="hover:bg-white/5">
                            <td className="px-6 py-4 text-white/80">{new Date(entry.effdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                            <td className="px-6 py-4 text-right font-mono text-[#d4af37]">${Number(entry.unitprice).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="2" className="px-6 py-8 text-center text-white/40 text-xs">No price history yet.</td></tr>
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