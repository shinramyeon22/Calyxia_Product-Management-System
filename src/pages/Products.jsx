import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { enrichProductsWithCurrentPrice, getPriceHistory, addPriceEntry, updateProduct } from '../services/productService';
import Navbar from '../components/Navbar';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/useToast';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext'; 

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
  const { isSidebarOpen } = useSidebar(); // Access sidebar state
  const [searchParams] = useSearchParams();
  
  // Check if user is Admin or Superadmin
  const isStaff = user?.user_type === 'ADMIN' || user?.user_type === 'SUPERADMIN';

  // State for active tab (Products vs Product Listing)
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'listing' ? 'listing' : 'products'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    setActiveTab(tab === 'listing' ? 'listing' : 'products');
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
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
            <div>
              <h1 className="serif-font text-6xl md:text-7xl italic tracking-tighter">
                {activeTab === 'products' ? 'Products' : 'Product Listing'}
              </h1>
              <p className="text-white/60 mt-2">
                {activeTab === 'products' ? 'Manage product catalogue' : 'Current prices for all active assets'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={exportToCSV} disabled={!filteredProducts.length} className="bg-[#d4af37] hover:bg-white text-black text-xs tracking-[0.15em] px-6 py-3 rounded transition-all">
                EXPORT CSV
              </button>
              <button onClick={() => window.location.reload()} className="border border-white/20 hover:bg-white/5 text-xs tracking-[0.15em] px-6 py-3 rounded transition-all">
                REFRESH
              </button>
            </div>
          </div>

          {/* Stats & Search */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 items-start md:items-center">
            <div className="inline-flex items-center gap-4 bg-black/50 border border-white/10 px-6 py-4 rounded-2xl">
              <div className="text-3xl">📦</div>
              <div>
                <div className="text-2xl font-mono text-[#d4af37]">{products.length}</div>
                <div className="text-[10px] tracking-widest text-white/50">ACTIVE PRODUCTS</div>
              </div>
            </div>
            <div className="relative flex-1 max-w-md w-full">
              <input type="text" placeholder="Search code or description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-black border border-white/10 pl-12 py-4 text-sm focus:border-[#d4af37] outline-none rounded-2xl" />
              <div className="absolute left-5 top-4 text-white/40">🔍</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-white/10 overflow-hidden rounded-2xl shadow-2xl bg-black/40">
            {loading ? (
              <div className="text-center py-20 text-[#d4af37] animate-pulse">SYNCHRONIZING CATALOGUE...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/70 border-b border-white/10 text-[10px] tracking-[0.2em] text-white/60 uppercase">
                    <th className="px-8 py-5 text-left">Product Code</th>
                    <th className="px-8 py-5 text-left">Description</th>
                    <th className="px-8 py-5 text-center">Unit</th>
                    {activeTab === 'products' ? (
                      <>
                        {isStaff && <th className="px-8 py-5 text-center">Status</th>}
                        <th className="px-8 py-5 text-center">Actions</th>
                      </>
                    ) : (
                      <>
                        <th className="px-8 py-5 text-right">Price</th>
                        <th className="px-8 py-5 text-left pl-12">Effective</th>
                        <th className="px-8 py-5 text-center">Actions</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-mono text-[#d4af37]">{p.prodcode}</td>
                      <td className="px-8 py-6 text-white/80">{p.description}</td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] uppercase tracking-widest">{p.unit}</span>
                      </td>
                      {activeTab === 'products' ? (
                        <>
                          {isStaff && (
                            <td className="px-8 py-6 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${p.record_status === 'A' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {p.record_status === 'A' ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                          )}
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-3">
                              <Link to={`/product/${p.id}`} className="px-3 py-1.5 border border-[#d4af37] text-[#d4af37] text-[10px] rounded hover:bg-[#d4af37] hover:text-black transition">VIEW</Link>
                              {isStaff && <button onClick={() => openEditModal(p)} className="px-3 py-1.5 border border-white/20 text-white/60 text-[10px] rounded hover:border-white/40 transition">EDIT</button>}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-8 py-6 text-right font-mono text-[#d4af37]">₱{Number(p.price || 0).toLocaleString()}</td>
                          <td className="px-8 py-6 text-white/40 text-xs pl-12">
                            {p.effective_date ? new Date(p.effective_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="flex justify-center gap-3">
                              <button onClick={() => openHistoryModal(p)} className="px-3 py-1.5 border border-white/20 text-white/60 text-[10px] rounded hover:border-[#d4af37] hover:text-[#d4af37] transition">HISTORY</button>
                              <Link to={`/product/${p.id}`} className="px-3 py-1.5 border border-[#d4af37] text-[#d4af37] text-[10px] rounded hover:bg-[#d4af37] hover:text-black transition">VIEW</Link>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* MODALS (Edit & History) go here... (Keep your existing Modal code here) */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
           {/* ... existing edit modal code ... */}
        </div>
      )}
      
      {showHistoryModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
           {/* ... existing history modal code ... */}
        </div>
      )}
    </div>
  );
}