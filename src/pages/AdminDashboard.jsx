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
      const { error } = await supabase.from('app_user').update({ record_status: 'INACTIVE' }).eq('id', userId);
      if (error) throw error;
      const { data: verify } = await supabase.from('app_user').select('record_status').eq('id', userId).single();
      if (normalizeRecordStatus(verify?.record_status) !== 'INACTIVE') throw new Error('Database did not apply the update. Check Supabase RLS policies.');
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
      const { error } = await supabase.from('app_user').update({ record_status: 'ACTIVE' }).eq('id', userId);
      if (error) throw error;
      const { data: verify } = await supabase.from('app_user').select('record_status').eq('id', userId).single();
      if (normalizeRecordStatus(verify?.record_status) !== 'ACTIVE') throw new Error('Database did not apply the update. Check Supabase RLS policies.');
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
    const { error } = await supabase.from('app_user').update({ user_type: normalized }).eq('id', userId);
    if (error) {
      showToast('Failed to update role. Check Supabase RLS policies.', 'error');
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: normalized } : u));
      showToast(`Role updated to ${normalized}.`, 'success');
    }
  };

  const filteredUsers = users
    .filter((u) => {
      const query = searchTerm.toLowerCase();
      const rowStatus = normalizeRecordStatus(u.record_status).toLowerCase();
      return (u.email || '').toLowerCase().includes(query) &&
        (statusFilter === 'all' || rowStatus === statusFilter);
    })
    .sort((a, b) => (a.email || "").localeCompare(b.email || ""));

  return (
    <div className="min-h-screen pt-20" style={{ background: 'linear-gradient(135deg, #ececf8 0%, #f5f5ff 45%, #eef0ff 100%)' }}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 p-8 md:p-10 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

          {/* Floating background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.13) 0%, transparent 65%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.10) 0%, transparent 65%)', filter: 'blur(30px)' }} />
            <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', filter: 'blur(50px)' }} />
            <div style={{ position: 'absolute', top: '80px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.55), 0 0 0 4px rgba(99,102,241,0.08)' }} />
            <div style={{ position: 'absolute', top: '240px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.45)' }} />
            <div style={{ position: 'absolute', top: '60px', right: '12%', width: '110px', height: '110px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(199,210,254,0.18) 100%)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', transform: 'rotate(18deg)', boxShadow: '0 8px 32px rgba(99,102,241,0.10)' }} />
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 relative">
            <div>
              <div className="text-[#6366f1] text-xs tracking-[0.4em] mb-2 uppercase font-semibold">Administration</div>
              <h1 className="serif-font text-5xl italic tracking-tighter" style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #7c3aed 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
              }}>User Accounts</h1>
              <p className="text-slate-400 mt-2">Manage system access and identity permissions</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#1e1b4b] placeholder:text-slate-300 focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition w-64 bg-white/80 backdrop-blur-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 outline-none bg-white/80 backdrop-blur-sm focus:border-[#6366f1] transition cursor-pointer"
              >
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
                <option value="all">All Records</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden min-h-[400px] relative rounded-2xl" style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(238,242,255,0.75) 100%)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(99,102,241,0.14)',
            boxShadow: '0 2px 0 rgba(255,255,255,0.95) inset, 0 12px 40px rgba(99,102,241,0.09)'
          }}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[#6366f1] text-xs tracking-[0.4em] animate-pulse uppercase">Synchronizing...</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-white/50 text-[10px] tracking-[0.3em] text-slate-400 uppercase">
                    <th className="px-6 py-5 font-semibold">Identity / Email</th>
                    <th className="px-6 py-5 font-semibold text-center">Authorization</th>
                    <th className="px-6 py-5 font-semibold text-center">Status</th>
                    <th className="px-6 py-5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
                            {u.email?.[0].toUpperCase()}
                          </div>
                          <div className="text-sm font-medium text-[#1e1b4b]">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 rounded-full bg-[#eef2ff] text-[#6366f1] text-[10px] font-bold tracking-wider border border-[#6366f1]/20 uppercase">
                          {u.user_type || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${normalizeRecordStatus(u.record_status) === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                          <span className={`text-[10px] tracking-wider font-medium uppercase ${normalizeRecordStatus(u.record_status) === 'ACTIVE' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {normalizeRecordStatus(u.record_status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {isSuperAdmin ? (
                            <>
                              {u.user_type !== 'SUPERADMIN' && (
                                <button onClick={() => handleEdit(u.id)} className="p-2 hover:bg-[#eef2ff] rounded-lg transition-colors text-slate-400 hover:text-[#6366f1]" title="Edit Role">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              )}
                              {u.user_type !== 'SUPERADMIN' && u.id !== currentAdmin?.id && (
                                normalizeRecordStatus(u.record_status) === 'ACTIVE' ? (
                                  <button onClick={() => suspendUser(u.id, u.email)} disabled={togglingIds.has(u.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider border border-red-200 text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {togglingIds.has(u.id) ? '...' : 'Suspend'}
                                  </button>
                                ) : (
                                  <button onClick={() => grantUser(u.id, u.email)} disabled={togglingIds.has(u.id)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {togglingIds.has(u.id) ? '...' : 'Grant'}
                                  </button>
                                )
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] tracking-wider text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filteredUsers.length === 0 && (
              <div className="py-20 text-center text-slate-400 text-xs tracking-[0.4em] uppercase">No identities found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
