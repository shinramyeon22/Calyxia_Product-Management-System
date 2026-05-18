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
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    async function fetchStats() {
      try {
        const [{ count: prodCount }, { count: userCount }, { count: delCount }] = await Promise.all([
          supabase.from('product').select('*', { count: 'exact', head: true }).eq('record_status', 'A'),
          supabase.from('app_user').select('*', { count: 'exact', head: true }).eq('record_status', 'ACTIVE'),
          supabase.from('product').select('*', { count: 'exact', head: true }).eq('record_status', 'I')
        ]);
        setStats({ totalProducts: prodCount || 0, activeUsers: userCount || 0, deletedCount: delCount || 0 });
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #080614 0%, #0d0a22 45%, #0a0818 100%)' }}>
      <Navbar />
      <div className="flex">
        <Sidebar />

        <div className={`flex-1 transition-all duration-300 p-8 pt-28 pb-16 relative overflow-hidden ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>

          {/* Floating background orbs */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div style={{ position: 'absolute', top: '-100px', right: '8%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.22) 0%, transparent 65%)', filter: 'blur(60px)' }} />
            <div style={{ position: 'absolute', top: '300px', right: '3%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 65%)', filter: 'blur(40px)' }} />
            <div style={{ position: 'absolute', bottom: '80px', left: '15%', width: '340px', height: '340px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 65%)', filter: 'blur(60px)' }} />

            {/* Floating dots */}
            <div style={{ position: 'absolute', top: '110px', right: '9%', width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.6), 0 0 0 4px rgba(99,102,241,0.12)' }} />
            <div style={{ position: 'absolute', top: '260px', right: '22%', width: '9px', height: '9px', borderRadius: '50%', background: 'linear-gradient(135deg, #a5b4fc, #c4b5fd)', boxShadow: '0 2px 12px rgba(139,92,246,0.5)' }} />
            <div style={{ position: 'absolute', top: '180px', right: '14%', width: '6px', height: '6px', borderRadius: '50%', background: '#c7d2fe', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }} />

            {/* Glass shape accents */}
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
          <div className="mb-14 relative">
            <span className="text-xs tracking-[0.4em] font-semibold block mb-3 uppercase" style={{ color: '#a5b4fc' }}>Overview</span>
            <h1 className="serif-font text-5xl md:text-6xl italic tracking-tighter leading-tight" style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a5b4fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Welcome back, {user?.email?.split('@')[0] || 'User'}
            </h1>
            <p className="mt-3 text-base" style={{ color: 'rgba(255,255,255,0.35)' }}>Here's what's happening today.</p>
          </div>

          {/* Summary Cards */}
          <div className={`grid gap-6 mb-12 ${userType === 'SUPERADMIN' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>

            {/* Product Listing — dark glass card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '28px',
                padding: '36px',
                boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.07) inset, 0 20px 60px rgba(99,102,241,0.20)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)'; }}
            >
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div className="text-xs tracking-[0.3em] mb-5 uppercase font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Product Listing</div>
              <div className="text-7xl font-mono mb-2 leading-none" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800
              }}>
                {loading ? '—' : stats.totalProducts}
              </div>
              <div className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Active Products</div>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 text-xs tracking-wider font-semibold transition-all"
                style={{ color: '#a5b4fc' }}
                onMouseEnter={e => { e.currentTarget.style.gap = '12px'; e.currentTarget.style.color = '#c4b5fd'; }}
                onMouseLeave={e => { e.currentTarget.style.gap = '8px'; e.currentTarget.style.color = '#a5b4fc'; }}
              >
                View Products →
              </Link>
            </div>

            {/* Users — deep indigo card (SUPERADMIN only) */}
            {userType === 'SUPERADMIN' && (
              <div
                style={{
                  background: 'linear-gradient(145deg, #1e1b4b 0%, #2d2a6e 60%, #312e81 100%)',
                  borderRadius: '28px',
                  padding: '36px',
                  boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(30,27,75,0.50)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'default'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.08) inset, 0 20px 60px rgba(30,27,75,0.60)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(30,27,75,0.50)'; }}
              >
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '160px', height: '160px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.28) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-30px', left: '10px', width: '110px', height: '110px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '50%', right: '24px', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(165,180,252,0.6)', boxShadow: '0 0 8px rgba(165,180,252,0.5)' }} />

                <div className="text-xs tracking-[0.3em] mb-5 uppercase font-medium" style={{ color: 'rgba(165,180,252,0.7)' }}>Users</div>
                <div className="text-7xl font-mono mb-2 leading-none text-white" style={{ fontWeight: 800 }}>
                  {loading ? '—' : stats.activeUsers}
                </div>
                <div className="text-sm mb-8" style={{ color: 'rgba(165,180,252,0.55)' }}>Active Accounts</div>
                <Link to="/admin" className="inline-flex items-center gap-2 text-xs tracking-wider font-semibold transition-colors" style={{ color: 'rgba(165,180,252,0.8)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(165,180,252,0.8)'}
                >
                  Manage Users →
                </Link>
              </div>
            )}

            {/* Archive — dark glass card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '28px',
                padding: '36px',
                boxShadow: '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.07) inset, 0 20px 60px rgba(99,102,241,0.20)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 0 rgba(255,255,255,0.07) inset, 0 12px 40px rgba(0,0,0,0.35)'; }}
            >
              <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div className="text-xs tracking-[0.3em] mb-5 uppercase font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>Archive</div>
              <div className="text-7xl font-mono mb-2 leading-none" style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: 800
              }}>
                {loading ? '—' : stats.deletedCount}
              </div>
              <div className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Soft-Deleted Items</div>
              {hasRight('PRD_RESTORE') && (
                <Link
                  to="/deleted-items"
                  className="inline-flex items-center gap-2 text-xs tracking-wider font-semibold transition-all"
                  style={{ color: '#a5b4fc' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
                  onMouseLeave={e => e.currentTarget.style.color = '#a5b4fc'}
                >
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
