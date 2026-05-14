import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { hasRight } = useRights();
  const [stats, setStats] = useState({ totalProducts: 0, activeUsers: 0, deletedCount: 0 });
  const [loading, setLoading] = useState(true);

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userType);
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    async function fetchStats() {
      try {
        const [{ count: prodCount }, { count: userCount }, { count: delCount }] = await Promise.all([
          supabase.from('product').select('*', { count: 'exact', head: true }).eq('record_status', 'A'),
          supabase.from('app_user').select('*', { count: 'exact', head: true }).eq('record_status', 'ACTIVE'),
          supabase.from('product').select('*', { count: 'exact', head: true }).eq('record_status', 'I')
        ]);

        setStats({
          totalProducts: prodCount || 0,
          activeUsers: userCount || 0,
          deletedCount: delCount || 0
        });
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
  <div className="min-h-screen bg-[#050505] text-white">
    <Navbar />
    <div className="flex">
      <Sidebar />
      
      {/* Unified Layout Container: Matches Product & Deleted Items spacing */}
      <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        
        {/* Header Section */}
        <div className="mb-16">
          <span className="text-[#d4af37] text-xs tracking-[0.5em] block mb-2">OVERVIEW</span>
          {/* Matched text size to text-6xl md:text-7xl */}
          <h1 className="serif-font text-6xl md:text-7xl italic tracking-tighter leading-tight max-w-4xl">
            Welcome back, {user?.email?.split('@')[0] || 'User'}
          </h1>
          <p className="text-white/50 mt-4 text-lg">Here's what's happening in the vault today.</p>
        </div>

        {/* Summary Cards: Added rounded-2xl and adjusted padding to match product page "soft" look */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="border border-white/10 bg-black/40 p-10 rounded-2xl group hover:border-[#d4af37]/50 transition shadow-2xl">
            <div className="text-xs tracking-[0.5em] text-white/50 mb-4 uppercase">Product Listing</div>
            <div className="text-7xl font-mono text-[#d4af37] mb-2">{loading ? '—' : stats.totalProducts}</div>
            <div className="text-sm text-white/70">Active Assets in Vault</div>
            <Link to="/products" className="mt-8 inline-block text-xs tracking-widest border-b border-white/30 hover:border-[#d4af37] pb-1 transition-colors">VIEW PRODUCTS →</Link>
          </div>

          <div className="border border-white/10 bg-black/40 p-10 rounded-2xl group hover:border-[#d4af37]/50 transition shadow-2xl">
            <div className="text-xs tracking-[0.5em] text-white/50 mb-4 uppercase">Users</div>
            <div className="text-7xl font-mono text-[#d4af37] mb-2">{loading ? '—' : stats.activeUsers}</div>
            <div className="text-sm text-white/70">Active Identities</div>
            {isAdmin && (
              <Link to="/admin" className="mt-8 inline-block text-xs tracking-widest border-b border-white/30 hover:border-[#d4af37] pb-1 transition-colors">MANAGE USERS →</Link>
            )}
          </div>

          <div className="border border-white/10 bg-black/40 p-10 rounded-2xl group hover:border-[#d4af37]/50 transition shadow-2xl">
            <div className="text-xs tracking-[0.5em] text-white/50 mb-4 uppercase">Archive</div>
            <div className="text-7xl font-mono text-[#d4af37] mb-2">{loading ? '—' : stats.deletedCount}</div>
            <div className="text-sm text-white/70">Soft-Deleted Items</div>
            {hasRight('PRD_RESTORE') && (
              <Link to="/deleted-items" className="mt-8 inline-block text-xs tracking-widest border-b border-white/30 hover:border-[#d4af37] pb-1 transition-colors">VIEW DELETED →</Link>
            )}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mt-auto">
          <div className="text-xs tracking-[0.5em] text-white/50 mb-6 uppercase">Quick Actions</div>
          <div className="flex flex-wrap gap-4">
            <Link to="/products" className="px-8 py-4 border border-white/20 rounded hover:border-[#d4af37] hover:text-[#d4af37] text-sm tracking-widest transition-all">
              BROWSE PRODUCTS
            </Link>
            {isAdmin && (
              <>
                <Link to="/admin/products" className="px-8 py-4 border border-white/20 rounded hover:border-[#d4af37] hover:text-[#d4af37] text-sm tracking-widest transition-all">
                  MANAGE PRODUCTS
                </Link>
                {(hasRight('REP_001') || hasRight('REP_002')) && (
                  <Link to="/reports" className="px-8 py-4 border border-white/20 rounded hover:border-[#d4af37] hover:text-[#d4af37] text-sm tracking-widest transition-all">
                    VIEW REPORTS
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
}