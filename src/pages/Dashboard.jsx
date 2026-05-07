import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { supabase } from '../services/supabaseClient';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { hasRight } = useRights();
  const [stats, setStats] = useState({ totalProducts: 0, activeUsers: 0, deletedCount: 0 });
  const [loading, setLoading] = useState(true);

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userType);

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
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-8 py-16">
          <div className="mb-16">
            <span className="text-[#d4af37] text-xs tracking-[0.5em]">OVERVIEW</span>
            <h1 className="serif-font text-7xl italic tracking-tighter mt-2">Welcome back, {user?.email?.split('@')[0] || 'User'}</h1>
            <p className="text-white/50 mt-4 text-lg">Here's what's happening in the vault today.</p>
          </div>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="border border-white/10 bg-black/50 p-10 group hover:border-[#d4af37]/50 transition">
              <div className="text-xs tracking-[0.5em] text-white/50 mb-4">PRODUCT LISTING</div>
              <div className="text-7xl font-mono text-[#d4af37] mb-2">{loading ? '—' : stats.totalProducts}</div>
              <div className="text-sm text-white/70">Active Assets in Vault</div>
              <Link to="/products" className="mt-8 inline-block text-xs tracking-widest border-b border-white/30 hover:border-[#d4af37] pb-1">VIEW PRODUCTS →</Link>
            </div>

            <div className="border border-white/10 bg-black/50 p-10 group hover:border-[#d4af37]/50 transition">
              <div className="text-xs tracking-[0.5em] text-white/50 mb-4">USERS</div>
              <div className="text-7xl font-mono text-[#d4af37] mb-2">{loading ? '—' : stats.activeUsers}</div>
              <div className="text-sm text-white/70">Active Identities</div>
              {isAdmin && (
                <Link to="/admin" className="mt-8 inline-block text-xs tracking-widest border-b border-white/30 hover:border-[#d4af37] pb-1">MANAGE USERS →</Link>
              )}
            </div>

            <div className="border border-white/10 bg-black/50 p-10 group hover:border-[#d4af37]/50 transition">
              <div className="text-xs tracking-[0.5em] text-white/50 mb-4">ARCHIVE</div>
              <div className="text-7xl font-mono text-[#d4af37] mb-2">{loading ? '—' : stats.deletedCount}</div>
              <div className="text-sm text-white/70">Soft-Deleted Items</div>
              {hasRight('PRD_DEL') && (
                <Link to="/deleted-items" className="mt-8 inline-block text-xs tracking-widest border-b border-white/30 hover:border-[#d4af37] pb-1">VIEW DELETED →</Link>
              )}
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <div className="text-xs tracking-[0.5em] text-white/50 mb-6">QUICK ACTIONS</div>
            <div className="flex flex-wrap gap-4">
              <Link to="/products" className="px-8 py-4 border border-white/20 hover:border-[#d4af37] hover:text-[#d4af37] text-sm tracking-widest transition">BROWSE PRODUCTS</Link>
              {isAdmin && (
                <>
                  <Link to="/admin/products" className="px-8 py-4 border border-white/20 hover:border-[#d4af37] hover:text-[#d4af37] text-sm tracking-widest transition">MANAGE PRODUCTS</Link>
                  <Link to="/reports" className="px-8 py-4 border border-white/20 hover:border-[#d4af37] hover:text-[#d4af37] text-sm tracking-widest transition">VIEW REPORTS</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
