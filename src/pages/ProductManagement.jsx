import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);        // ← Now properly used
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image_url: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('product')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) alert(error.message);
    else setProducts(data || []);
    setLoading(false);
  }

  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      stock_quantity: product.stock_quantity,
      image_url: product.image_url || ''
    });
    setEditingId(product.id);
    setShowModal(true);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    const urlPattern = new RegExp('^(https?:\\/\\/)?'+ 
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
      '((\\d{1,3}\\.){3}\\d{1,3}))'+
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
      '(\\?[;&a-z\\d%_.~+=-]*)?'+
      '(\\#[-a-z\\d%_.~+=-]*)?$','i');

    if (formData.image_url.trim() !== "" && !urlPattern.test(formData.image_url)) {
      alert("Please enter a valid Image URL or leave it blank.");
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      image_url: formData.image_url.trim() === "" ? null : formData.image_url
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('product').update(productData).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('product').insert([productData]));
    }

    if (error) alert(error.message);
    else {
      finishSubmit();
    }
  }

  function finishSubmit() {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
    fetchProducts();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this asset?")) return;
    const { error } = await supabase.from('product').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchProducts();
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white pt-20">
        <Navbar />
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="w-8 h-[1px] bg-[#d4af37] mx-auto mb-6 animate-pulse"></div>
            <p className="text-[#d4af37] text-xs tracking-[0.5em]">LOADING INVENTORY...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="block text-[#d4af37] text-xs tracking-[0.5em] uppercase">Institutional Control</span>
            <h1 className="serif-font text-6xl italic tracking-tighter">Inventory Vault</h1>
          </div>
          <button 
            onClick={() => { 
              setEditingId(null); 
              setFormData({name:'', description:'', price:'', stock_quantity:'', image_url:''}); 
              setShowModal(true); 
            }}
            className="border border-[#d4af37] text-[#d4af37] px-10 py-4 text-xs tracking-widest hover:bg-[#d4af37] hover:text-black transition-all duration-300"
          >
            + ADD NEW ASSET
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-6">
            <div className="bg-[#0a0a0c] border border-white/10 w-full max-w-md p-10 rounded-none">
              <h2 className="serif-font text-4xl italic mb-8">
                {editingId ? 'Edit Asset' : 'New Asset'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-8">
                <input 
                  type="text" 
                  placeholder="ASSET NAME" 
                  required 
                  value={formData.name}
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-lg outline-none focus:border-[#d4af37]" 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />

                <textarea 
                  placeholder="DESCRIPTION" 
                  value={formData.description}
                  className="w-full bg-transparent border-b border-white/20 pb-3 h-28 outline-none focus:border-[#d4af37]"
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                />

                <div className="grid grid-cols-2 gap-8">
                  <input 
                    type="number" 
                    placeholder="PRICE" 
                    required 
                    value={formData.price}
                    className="w-full bg-transparent border-b border-white/20 pb-3 outline-none focus:border-[#d4af37]"
                    onChange={(e) => setFormData({...formData, price: e.target.value})} 
                  />
                  <input 
                    type="number" 
                    placeholder="STOCK" 
                    required 
                    value={formData.stock_quantity}
                    className="w-full bg-transparent border-b border-white/20 pb-3 outline-none focus:border-[#d4af37]"
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} 
                  />
                </div>

                <input 
                  type="text" 
                  placeholder="IMAGE URL (OPTIONAL)" 
                  value={formData.image_url}
                  className="w-full bg-transparent border-b border-white/20 pb-3 outline-none focus:border-[#d4af37]"
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})} 
                />

                <div className="flex gap-4 pt-6">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 border border-white/30 hover:bg-white/5 transition"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#d4af37] text-black font-medium tracking-widest hover:bg-white transition"
                  >
                    {editingId ? 'SAVE CHANGES' : 'CREATE ASSET'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/50 border-b border-white/10">
              <tr className="text-xs tracking-widest text-white/60">
                <th className="px-8 py-6">ASSET</th>
                <th className="px-8 py-6">PRICE</th>
                <th className="px-8 py-6">STOCK</th>
                <th className="px-8 py-6 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition group">
                  <td className="px-8 py-8 font-medium">{p.name}</td>
                  <td className="px-8 py-8 text-[#d4af37]">₱{p.price.toLocaleString()}</td>
                  <td className="px-8 py-8">{p.stock_quantity}</td>
                  <td className="px-8 py-8 text-right">
                    <button onClick={() => openEditModal(p)} className="text-white/70 hover:text-white mr-6">EDIT</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-400/70 hover:text-red-400">DELETE</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}