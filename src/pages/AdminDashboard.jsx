import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useToast } from '../context/useToast';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState(new Set());
  const { user: currentAdmin } = useAuth();
  const isSuperAdmin = String(currentAdmin?.user_type || '').toUpperCase() === 'SUPERADMIN';
  const { isSidebarOpen } = useSidebar();
  const { showToast } = useToast();
  const hasFetched = useRef(false);

  const normalizeRecordStatus = (s) => {
    const v = String(s || '').toUpperCase();
    return (v === 'A' || v === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE';
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('app_user').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchUsers();
      hasFetched.current = true;
    }
  }, [fetchUsers]);

  const suspendUser = async (userId, email) => {
    if (!window.confirm(`Suspend ${email}?\nThey will immediately lose access to the system.`)) return;

    setTogglingIds(prev => new Set(prev).add(userId));
    try {
      const { error } = await supabase
        .from('app_user')
        .update({ record_status: 'INACTIVE' })
        .eq('id', userId);
      if (error) throw error;

      // Verify DB actually updated (silent RLS failures return no error but change nothing)
      const { data: verify } = await supabase
        .from('app_user').select('record_status').eq('id', userId).single();
      if (normalizeRecordStatus(verify?.record_status) !== 'INACTIVE') {
        throw new Error('Database did not apply the update. Check Supabase RLS policies.');
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, record_status: 'INACTIVE' } : u));
      showToast(`${email} has been suspended.`, 'error');
    } catch (err) {
      console.error('Suspend failed:', err.message);
      showToast(err.message || 'Failed to suspend account.', 'error');
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const grantUser = async (userId, email) => {
    setTogglingIds(prev => new Set(prev).add(userId));
    try {
      const { error } = await supabase
        .from('app_user')
        .update({ record_status: 'ACTIVE' })
        .eq('id', userId);
      if (error) throw error;

      // Verify DB actually updated
      const { data: verify } = await supabase
        .from('app_user').select('record_status').eq('id', userId).single();
      if (normalizeRecordStatus(verify?.record_status) !== 'ACTIVE') {
        throw new Error('Database did not apply the update. Check Supabase RLS policies.');
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, record_status: 'ACTIVE' } : u));
      showToast(`${email} has been approved and can now sign in.`, 'success');
    } catch (err) {
      console.error('Grant failed:', err.message);
      showToast(err.message || 'Failed to approve account.', 'error');
    } finally {
      setTogglingIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    }
  };

  const handleEdit = async (userId) => {
    const newRole = prompt("Enter new Authorization (SUPERADMIN, ADMIN, USER):");
    if (!newRole) return;
    const normalized = newRole.trim().toUpperCase();
    if (!['SUPERADMIN', 'ADMIN', 'USER'].includes(normalized)) {
      showToast('Invalid role. Use SUPERADMIN, ADMIN, or USER.', 'error');
      return;
    }

    const { error } = await supabase
      .from('app_user')
      .update({ user_type: normalized })
      .eq('id', userId);

    if (error) {
      showToast('Failed to update role. Check Supabase RLS policies.', 'error');
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: normalized } : u));
      showToast(`Role updated to ${normalized}.`, 'success');
    }
  };

  // NEW: Filter + A-Z Sorting Logic
  const filteredUsers = users
    .filter((u) => {
      const query = searchTerm.toLowerCase();
      const rowStatus = normalizeRecordStatus(u.record_status).toLowerCase();
      const matchesSearch = (u.email || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || rowStatus === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 p-8 md:p-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-[#d4af37] text-xs tracking-[0.5em] mb-2 uppercase">Administration</div>
              <h1 className="serif-font text-7xl italic tracking-tighter">User Accounts</h1>
              <p className="text-white/50 mt-3 text-lg">Manage system access and identity permissions</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text"
                placeholder="SEARCH IDENTITIES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-b border-white/20 pb-2 text-sm tracking-widest outline-none focus:border-[#d4af37] transition-colors w-64 placeholder:text-white/20"
              />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-b border-white/20 pb-2 text-xs tracking-[0.2em] outline-none cursor-pointer uppercase text-white"
              >
                <option value="active" className="bg-[#050505]">Active Only</option>
                <option value="inactive" className="bg-[#050505]">Inactive Only</option>
                <option value="all" className="bg-[#050505]">All Records</option>
              </select>
            </div>
          </div>

          <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/40 min-h-[400px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                <div className="text-[#d4af37] text-xs tracking-[0.5em] animate-pulse uppercase">Synchronizing...</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] tracking-[0.3em] text-white/40 uppercase">
                    <th className="px-8 py-6 font-medium">Identity / Email</th>
                    <th className="px-8 py-6 font-medium text-center">Authorization</th>
                    <th className="px-8 py-6 font-medium text-center">Status</th>
                    <th className="px-8 py-6 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[#d4af37] text-xs font-bold">
                            {u.email?.[0].toUpperCase()}
                          </div>
                          <div className="font-mono text-sm tracking-tight">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-1.5 rounded-full bg-[#d4af37]/10 text-[#d4af37] text-[10px] font-bold tracking-widest border border-[#d4af37]/20 uppercase">
                          {u.user_type || 'USER'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${normalizeRecordStatus(u.record_status) === 'ACTIVE' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
                          <span className="text-[10px] tracking-widest text-white/60 uppercase">
                            {normalizeRecordStatus(u.record_status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-3">
                          {isSuperAdmin ? (
                            <>
                              {u.user_type !== 'SUPERADMIN' && (
                                <button
                                  onClick={() => handleEdit(u.id)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-[#d4af37]"
                                  title="Edit Role"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}
                              {u.user_type !== 'SUPERADMIN' && u.id !== currentAdmin?.id && (
                                normalizeRecordStatus(u.record_status) === 'ACTIVE' ? (
                                  <button
                                    onClick={() => suspendUser(u.id, u.email)}
                                    disabled={togglingIds.has(u.id)}
                                    className="px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {togglingIds.has(u.id) ? '...' : 'SUSPEND'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => grantUser(u.id, u.email)}
                                    disabled={togglingIds.has(u.id)}
                                    className="px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {togglingIds.has(u.id) ? '...' : 'GRANT'}
                                  </button>
                                )
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] tracking-widest text-white/20">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filteredUsers.length === 0 && (
              <div className="py-20 text-center text-white/20 text-xs tracking-[0.5em]">NO IDENTITIES FOUND</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}