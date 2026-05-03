import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const { user: currentAdmin } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setErrorMsg(null);
      
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .order('email', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Dashboard Error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(userId, currentStatus) {
    if (userId === currentAdmin?.id) {
      alert("You cannot deactivate yourself!");
      return;
    }

    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const { error } = await supabase
      .from('app_user')
      .update({ record_status: newStatus })
      .eq('id', userId);

    if (error) alert("Update failed: " + error.message);
    else fetchUsers();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Navbar />
        <p className="text-[#d4af37] tracking-widest text-sm">ACCESSING RECORDS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 max-w-7xl mx-auto px-8 py-16">
          {/* Header */}
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="block text-[#d4af37] text-xs tracking-[0.5em]">ADMINISTRATION</span>
              <h1 className="serif-font text-7xl italic tracking-tighter text-[#f3d995]">
                User Registry
              </h1>
              <p className="text-white/50 mt-3 text-lg">Manage system identities and permissions</p>
            </div>
            
            <button 
              onClick={fetchUsers} 
              className="border border-white/30 hover:border-[#d4af37] hover:text-[#d4af37] px-10 py-4 text-xs tracking-widest transition-all duration-300"
            >
              REFRESH RECORDS
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-900/20 border border-red-500/50 p-6 mb-10 text-red-400 rounded">
              {errorMsg}
            </div>
          )}

          {/* Table Container */}
          <div className="border border-white/10 bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-black/60 border-b border-white/10">
                <tr className="text-xs tracking-widest text-white/60">
                  <th className="px-8 py-6 text-left">IDENTITY</th>
                  <th className="px-8 py-6 text-left">ROLE</th>
                  <th className="px-8 py-6 text-left">STATUS</th>
                  <th className="px-8 py-6 text-center">CONTROL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-all duration-200">
                    <td className="px-8 py-8 font-medium">{u.email}</td>
                    <td className="px-8 py-8">
                      <span className={`px-5 py-1.5 text-xs border rounded-full tracking-widest
                        ${u.user_type === 'ADMIN' || u.user_type === 'SUPERADMIN' 
                          ? 'border-[#d4af37] text-[#d4af37]' 
                          : 'border-white/30 text-white/70'}`}>
                        {u.user_type}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`px-5 py-1.5 text-xs rounded-full tracking-widest
                        ${u.record_status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.record_status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-center">
                      <button 
                        onClick={() => toggleStatus(u.id, u.record_status)}
                        disabled={u.id === currentAdmin?.id}
                        className={`text-sm tracking-widest transition-colors
                          ${u.id === currentAdmin?.id 
                            ? 'text-white/30 cursor-not-allowed' 
                            : 'hover:text-[#d4af37] text-white/80'}`}
                      >
                        {u.id === currentAdmin?.id 
                          ? 'CURRENT ADMIN' 
                          : (u.record_status === 'ACTIVE' ? 'DEACTIVATE' : 'ACTIVATE')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Note */}
          <div className="mt-10 text-xs text-white/40 tracking-widest leading-relaxed max-w-2xl">
            Note: SUPERADMIN accounts have full system rights. ADMIN can manage users and inventory. 
            USER accounts have view-only access to the collection.
          </div>
        </div>
      </div>
    </div>
  );
}