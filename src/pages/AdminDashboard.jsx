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

  async function toggleStatus(userId, currentStatus, userType) {
    if (userId === currentAdmin?.id) {
      alert("You cannot deactivate yourself!");
      return;
    }
    if (userType === 'SUPERADMIN') {
      alert("SUPERADMIN accounts cannot be modified. This action is blocked for security.");
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
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="block text-[#d4af37] text-xs tracking-[0.5em]">ADMINISTRATION</span>
              <h1 className="serif-font text-6xl italic tracking-tighter">User Registry</h1>
            </div>
            <button onClick={fetchUsers} className="border border-white/30 px-8 py-4 text-xs tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition">
              REFRESH RECORDS
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-900/20 border border-red-500/50 p-6 mb-10 text-red-400">
              {errorMsg}
            </div>
          )}

          <div className="border border-white/10">
            <table className="w-full">
              <thead className="bg-black/60">
                <tr className="text-xs tracking-widest text-white/60">
                  <th className="px-8 py-6 text-left">IDENTITY</th>
                  <th className="px-8 py-6 text-left">ROLE</th>
                  <th className="px-8 py-6 text-left">STATUS</th>
                  <th className="px-8 py-6 text-right">CONTROL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="px-8 py-8">{u.email}</td>
                    <td className="px-8 py-8">
                      <span className={`px-4 py-1 text-xs border ${u.user_type === 'ADMIN' || u.user_type === 'SUPERADMIN' ? 'border-[#d4af37] text-[#d4af37]' : 'border-white/30'}`}>
                        {u.user_type}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <span className={`px-4 py-1 text-xs ${u.record_status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {u.record_status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <button 
                        onClick={() => toggleStatus(u.id, u.record_status, u.user_type)}
                        disabled={u.id === currentAdmin?.id || u.user_type === 'SUPERADMIN'}
                        className={`text-sm ${u.id === currentAdmin?.id || u.user_type === 'SUPERADMIN' ? 'text-white/30' : 'hover:text-[#d4af37]'}`}
                        title={u.user_type === 'SUPERADMIN' ? 'SUPERADMIN accounts cannot be modified' : ''}
                      >
                        {u.id === currentAdmin?.id ? 'CURRENT ADMIN' : u.user_type === 'SUPERADMIN' ? 'PROTECTED' : (u.record_status === 'ACTIVE' ? 'DEACTIVATE' : 'ACTIVATE')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 text-xs text-white/40 tracking-widest">
            Note: SUPERADMIN accounts have full system rights. ADMIN can manage users and inventory. USER accounts have view-only access to the collection.
          </div>
        </div>
      </div>
    </div>
  );
}
