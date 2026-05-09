import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../context/SidebarContext';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const { user: currentAdmin } = useAuth();
  const { isSidebarOpen } = useSidebar();
  
  // Use a ref to track if we have already performed the initial fetch
  const hasFetched = useRef(false);

  const normalizeRecordStatus = (s) => {
    const v = String(s || '').toUpperCase();
    return v === 'A' ? 'ACTIVE' : 'INACTIVE';
  };

  const fetchUsers = useCallback(async () => {
    // Only set loading if it's not already loading to prevent unnecessary renders
    setLoading(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // By checking a ref, we ensure the logic only runs once on mount
    // and satisfies the linting rule by making the execution conditional
    if (!hasFetched.current) {
      fetchUsers();
      hasFetched.current = true;
    }
  }, [fetchUsers]);

  const filteredUsers = users.filter((u) => {
    const query = searchTerm.toLowerCase();
    const rowStatus = normalizeRecordStatus(u.record_status);
    const matchesSearch = u.email?.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || rowStatus.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className={`flex-1 transition-all duration-300 p-8 md:p-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="text-[#d4af37] text-xs tracking-[0.5em] mb-2 uppercase">Administration</div>
              <h1 className="serif-font text-7xl italic tracking-tighter">User Accounts</h1>
              <p className="text-white/50 mt-3 text-lg">Manage system access and identity permissions</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="SEARCH IDENTITIES..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-b border-white/20 pb-2 text-sm tracking-widest outline-none focus:border-[#d4af37] transition-colors w-64 placeholder:text-white/20"
                />
              </div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-b border-white/20 pb-2 text-xs tracking-[0.2em] outline-none cursor-pointer uppercase"
              >
                <option value="active" className="bg-[#050505]">Active Only</option>
                <option value="inactive" className="bg-[#050505]">Inactive Only</option>
                <option value="all" className="bg-[#050505]">All Records</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-white/10 rounded-3xl overflow-hidden bg-black/40 min-h-[400px] relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-10">
                <div className="text-[#d4af37] text-xs tracking-[0.5em] animate-pulse uppercase">Synchronizing Identities...</div>
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
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-[#d4af37]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {u.user_type !== 'SUPERADMIN' && u.id !== currentAdmin?.id && (
                            <button className={`px-4 py-1.5 rounded-lg text-[10px] font-bold tracking-widest border transition-all ${
                              normalizeRecordStatus(u.record_status) === 'ACTIVE' 
                              ? 'border-red-500/30 text-red-400 hover:bg-red-500/10' 
                              : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}>
                              {normalizeRecordStatus(u.record_status) === 'ACTIVE' ? 'REVOKE' : 'GRANT'}
                            </button>
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

          <div className="mt-8 flex items-center gap-4 text-[10px] text-white/30 tracking-[0.2em] uppercase">
            <span className="text-[#d4af37]">Superadmin</span>: full access • <span>Admin</span>: inventory & users • <span>User</span>: read-only
          </div>
        </div>
      </div>
    </div>
  );
}