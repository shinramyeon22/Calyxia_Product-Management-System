import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import Sidebar from './Sidebar';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
  const username = user?.email?.split('@')[0] || 'User';

  const normalizeUserType = (type) => String(type || 'USER').trim().replace(/[\s_-]+/g, '').toUpperCase();
  const userType = normalizeUserType(user?.user_type);
  const roleDisplay = (userType || 'USER').toLowerCase();

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-200 h-20"
        style={{
          background: '#080614',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center h-20">

          {/* Desktop: sidebar-aligned left section */}
          <div
            className={`hidden lg:flex items-center h-full px-4 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64 gap-3' : 'w-20 justify-center'}`}
            style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={toggleSidebar}
              className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-xl transition flex-shrink-0"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            {isSidebarOpen && (
              <Link to="/dashboard" className="serif-font text-xl italic tracking-tight font-bold truncate" style={{ color: '#a5b4fc' }}>
                Calyxia
              </Link>
            )}
          </div>

          {/* Mobile: hamburger + logo */}
          <div className="lg:hidden flex items-center gap-3 px-4">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-xl transition"
              style={{ color: 'rgba(255,255,255,0.45)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            <Link to="/dashboard" className="serif-font text-xl italic tracking-tight font-bold" style={{ color: '#a5b4fc' }}>
              Calyxia
            </Link>
          </div>

          {/* Right: User info + Sign out */}
          <div className="flex-1 flex items-center justify-end px-6 gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.45)' }}
              >
                {userInitial}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>{username}</div>
                <div className="text-[10px] capitalize -mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{roleDisplay}</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-5 py-2 text-xs font-semibold tracking-wide rounded-xl transition-all"
              style={{ color: 'rgba(248,113,113,0.9)', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(248,113,113,0.9)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <Sidebar
        isOpen={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        isCollapsed={!isSidebarOpen}
      />
    </>
  );
}
