import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null); // Track if we are editing
  
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

  // PREPARE FOR EDIT
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

  // 1. URL VALIDATION LOGIC
  const urlPattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d%_.~+=-]*)?$','i'); // fragment locator

  // If there's text in image_url, check if it's a valid pattern
  if (formData.image_url.trim() !== "" && !urlPattern.test(formData.image_url)) {
    alert("Please enter a valid Image URL (e.g., https://example.com/image.jpg) or leave it blank.");
    return; // STOP the function here
  }

  const productData = {
    name: formData.name,
    description: formData.description || null,
    price: parseFloat(formData.price),
    stock_quantity: parseInt(formData.stock_quantity) || 0,
    image_url: formData.image_url.trim() === "" ? null : formData.image_url
  };

  // ... (rest of your insert/update logic)
  if (editingId) {
     // update call...
  } else {
     // insert call...
  }
}

  function finishSubmit() {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
    fetchProducts();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    const { error: deleteError } = await supabase.from('product').delete().eq('id', id);
    if (deleteError) alert(deleteError.message);
    else fetchProducts();
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Inventory</h1>
          <button 
            onClick={() => { setEditingId(null); setFormData({name:'', description:'', price:'', stock_quantity:'', image_url:''}); setShowModal(true); }}
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold transition"
          >
            + Add Product
          </button>
        </div>

        {/* --- DYNAMIC MODAL (ADD or EDIT) --- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-[#0f0f12] border border-[#1f1f23] w-full max-w-md p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  type="text" placeholder="Product Name" required value={formData.name}
                  className="w-full bg-black border border-[#1f1f23] p-3 rounded-lg outline-none focus:border-purple-500"
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <textarea 
                  placeholder="Description" value={formData.description}
                  className="w-full bg-black border border-[#1f1f23] p-3 rounded-lg outline-none focus:border-purple-500 h-24"
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                ></textarea>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="number" placeholder="Price" required value={formData.price}
                    className="bg-black border border-[#1f1f23] p-3 rounded-lg outline-none focus:border-purple-500"
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                  <input 
                    type="number" placeholder="Stock" required value={formData.stock_quantity}
                    className="bg-black border border-[#1f1f23] p-3 rounded-lg outline-none focus:border-purple-500"
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                  />
                </div>
                <input 
                  type="text" placeholder="Image URL (optional)" value={formData.image_url}
                  className="w-full bg-black border border-[#1f1f23] p-3 rounded-lg outline-none focus:border-purple-500"
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                />
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 py-3 rounded-lg font-bold text-sm"
                  >
                    {editingId ? 'Save Changes' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-[#0f0f12] border border-[#1f1f23] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#1f1f23] text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23]">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/5 transition">
                  <td className="px-6 py-4 font-medium">{p.name}</td>
                  <td className="px-6 py-4 text-gray-300">${p.price}</td>
                  <td className="px-6 py-4 text-gray-300">{p.stock_quantity}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => openEditModal(p)}
                      className="text-indigo-400 hover:text-indigo-300 mr-4 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
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