import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';
import { useToast } from '../context/useToast';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [togglingIds, setTogglingIds] = useState(new Set());
  const { user: currentAdmin } = useAuth();
  const isSuperAdmin = String(currentAdmin?.user_type || '').toUpperCase() === 'SUPERADMIN';
  const { isSidebarOpen } = useSidebar();
  const { showToast } = useToast();

  const normalizeRecordStatus = (s) => {
    const v = String(s || '').toUpperCase();
    return (v === 'A' || v === 'ACTIVE') ? 'ACTIVE' : 'INACTIVE';
  };

  const pendingCount = users.filter(u => normalizeRecordStatus(u.record_status) === 'INACTIVE').length;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const { data, error } = await supabase
        .from('app_user')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err.message);
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    // Real-time subscription (works for direct writes; may miss trigger-inserted rows)
    const channel = supabase
      .channel('admin_app_user_watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_user' }, () => {
        fetchUsers();
      })
      .subscribe();

    // Poll every 10 s as a fallback for trigger-inserted rows that real-time misses
    const poll = setInterval(() => fetchUsers(), 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 p-8 md:p-10 pt-28 pb-16 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

          {/* Floating background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: '110px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.6), 0 0 0 4px rgba(99,102,241,0.12)' }} />
            <div style={{ position: 'absolute', top: '260px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.5)' }} />
            <div style={{ position: 'absolute', top: '180px', right: '14%', width: '6px', height: '6px', borderRadius: '50%', background: '#c7d2fe', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />
            <div style={{
              position: 'absolute', top: '60px', right: '12%',
              width: '120px', height: '120px', borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.30) 0%, rgba(139,92,246,0.12) 100%)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(12px)',
              transform: 'rotate(18deg)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.20)'
            }} />
            <div style={{
              position: 'absolute', top: '140px', right: '20%',
              width: '70px', height: '70px', borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(165,180,252,0.10) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(8px)',
              transform: 'rotate(-12deg)',
              boxShadow: '0 4px 20px rgba(99,102,241,0.15)'
            }} />
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6 relative">
            <div>
              <span className="text-xs tracking-[0.4em] font-semibold block mb-2 uppercase" style={{ color: '#a5b4fc' }}>Administration</span>
              <div className="flex items-center gap-3">
                <h1 className="serif-font text-5xl italic tracking-tighter" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
                }}>User Accounts</h1>
                {pendingCount > 0 && (
                  <span
                    title={`${pendingCount} account${pendingCount > 1 ? 's' : ''} awaiting approval`}
                    style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.30)' }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                    {pendingCount} PENDING
                  </span>
                )}
              </div>
              <p className="mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Manage system access and identity permissions</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  outline: 'none',
                  width: '256px',
                  backdropFilter: 'blur(12px)',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)',
                  borderRadius: '14px',
                  padding: '10px 16px',
                  fontSize: '13px',
                  outline: 'none',
                  backdropFilter: 'blur(12px)',
                  cursor: 'pointer',
                }}
              >
                <option value="all" style={{ background: '#0d0a22' }}>All Records</option>
                <option value="inactive" style={{ background: '#0d0a22' }}>Pending / Inactive</option>
                <option value="active" style={{ background: '#0d0a22' }}>Active Only</option>
              </select>
              <button
                onClick={fetchUsers}
                disabled={loading}
                title="Refresh user list"
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(99,102,241,0.35)',
                  background: 'rgba(99,102,241,0.08)',
                  color: '#a5b4fc',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.5 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'; }}
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {fetchError && (
            <div className="mb-4 px-5 py-3 rounded-xl text-xs" style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
              Database error: {fetchError} — check Supabase RLS policies for app_user SELECT.
            </div>
          )}

          {/* Table */}
          <div className="overflow-hidden min-h-[400px] relative rounded-2xl" style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)',
          }}>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-xs tracking-[0.4em] animate-pulse uppercase" style={{ color: '#a5b4fc' }}>Synchronizing...</div>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }} className="text-[10px] tracking-[0.3em] uppercase">
                    <th className="px-6 py-5 font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>Identity / Email</th>
                    <th className="px-6 py-5 font-semibold text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Authorization</th>
                    <th className="px-6 py-5 font-semibold text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Status</th>
                    <th className="px-6 py-5 font-semibold text-right" style={{ color: 'rgba(255,255,255,0.35)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 12px rgba(99,102,241,0.35)' }}>
                            {u.email?.[0].toUpperCase()}
                          </div>
                          <div className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase" style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
                          {u.user_type || 'USER'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${normalizeRecordStatus(u.record_status) === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          <span className="text-[10px] tracking-wider font-medium uppercase" style={{ color: normalizeRecordStatus(u.record_status) === 'ACTIVE' ? '#34d399' : '#f87171' }}>
                            {normalizeRecordStatus(u.record_status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-end gap-2">
                          {isSuperAdmin ? (
                            <>
                              {u.user_type !== 'SUPERADMIN' && (
                                <button
                                  onClick={() => handleEdit(u.id)}
                                  title="Edit Role"
                                  style={{ padding: '6px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', transition: 'all 0.15s' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; e.currentTarget.style.color = '#a5b4fc'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
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
                                    style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(239,68,68,0.30)', color: '#f87171', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s', opacity: togglingIds.has(u.id) ? 0.5 : 1 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.55)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)'; }}
                                  >
                                    {togglingIds.has(u.id) ? '...' : 'Suspend'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => grantUser(u.id, u.email)}
                                    disabled={togglingIds.has(u.id)}
                                    style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', border: '1px solid rgba(52,211,153,0.30)', color: '#34d399', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s', opacity: togglingIds.has(u.id) ? 0.5 : 1 }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.10)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.55)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.30)'; }}
                                  >
                                    {togglingIds.has(u.id) ? '...' : 'Grant'}
                                  </button>
                                )
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loading && filteredUsers.length === 0 && (
              <div className="py-20 text-center text-xs tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>No identities found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
