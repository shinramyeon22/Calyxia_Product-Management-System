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

  const normalizeUserType = (type) => String(type || 'USER').trim().replace(/[\s_-]+/g, '').toUpperCase();
  const userType = normalizeUserType(
    user?.user_type ||
    user?.raw_user_meta_data?.user_type ||
    user?.raw_user_meta_data?.role ||
    user?.user_metadata?.user_type ||
    user?.user_metadata?.role ||
    user?.app_metadata?.user_type ||
    user?.app_metadata?.role
  );
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
    <div className="min-h-screen bg-[#f8faff]">
      <Navbar />
      <div className="flex">
        <Sidebar />

        <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-12 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

          {/* Header */}
          <div className="mb-12">
            <span className="text-[#6366f1] text-xs tracking-[0.4em] font-semibold block mb-2 uppercase">Overview</span>
            <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter leading-tight text-[#1e1b4b]">
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="text-slate-400 mt-3 text-base">Here's what's happening today.</p>
          </div>

          {/* Summary Cards */}
          <div className={`grid gap-6 mb-12 ${userType === 'SUPERADMIN' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-[#6366f1]/30 transition-all">
              <div className="text-xs tracking-[0.3em] text-slate-400 mb-4 uppercase font-medium">Product Listing</div>
              <div className="text-6xl font-mono text-[#6366f1] mb-2">{loading ? '—' : stats.totalProducts}</div>
              <div className="text-sm text-slate-500">Active Products</div>
              <Link to="/products" className="mt-6 inline-block text-xs tracking-wider text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors">
                View Products →
              </Link>
            </div>

            {userType === 'SUPERADMIN' && (
              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-[#6366f1]/30 transition-all">
                <div className="text-xs tracking-[0.3em] text-slate-400 mb-4 uppercase font-medium">Users</div>
                <div className="text-6xl font-mono text-[#6366f1] mb-2">{loading ? '—' : stats.activeUsers}</div>
                <div className="text-sm text-slate-500">Active Accounts</div>
                <Link to="/admin" className="mt-6 inline-block text-xs tracking-wider text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors">
                  Manage Users →
                </Link>
              </div>
            )}

            <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:shadow-md hover:border-[#6366f1]/30 transition-all">
              <div className="text-xs tracking-[0.3em] text-slate-400 mb-4 uppercase font-medium">Archive</div>
              <div className="text-6xl font-mono text-[#6366f1] mb-2">{loading ? '—' : stats.deletedCount}</div>
              <div className="text-sm text-slate-500">Soft-Deleted Items</div>
              {hasRight('PRD_RESTORE') && (
                <Link to="/deleted-items" className="mt-6 inline-block text-xs tracking-wider text-[#6366f1] font-semibold hover:text-[#4f46e5] transition-colors">
                  View Deleted →
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
