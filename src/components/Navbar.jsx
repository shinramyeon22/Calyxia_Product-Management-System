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
  const userType = normalizeUserType(
    user?.user_type ||
    user?.raw_user_meta_data?.user_type ||
    user?.raw_user_meta_data?.role ||
    user?.user_metadata?.user_type ||
    user?.user_metadata?.role ||
    user?.app_metadata?.user_type ||
    user?.app_metadata?.role
  );
  const roleDisplay = (userType || 'USER').toLowerCase();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-black border-b border-white/10 z-[200] h-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          {/* Left: Logo + Hamburger */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  toggleSidebar();     // Toggle desktop sidebar via context
                } else {
                  setShowMobileSidebar(!showMobileSidebar); // Mobile drawer
                }
              }}
              className="flex items-center justify-center w-10 h-10 text-white/70 hover:text-white transition"
            >
              <div className="space-y-1">
                <div className="w-6 h-px bg-current"></div>
                <div className="w-6 h-px bg-current"></div>
                <div className="w-6 h-px bg-current"></div>
              </div>
            </button>

            <Link to="/dashboard" className="serif-font text-3xl italic text-[#d4af37] tracking-tighter">
              Calyxia
            </Link>
          </div>

          {/* Right: User Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#d4af37] flex items-center justify-center text-black text-sm font-semibold">
                {userInitial}
              </div>
              <div className="hidden md:block">
                <div className="text-sm text-white">{username}</div>
                <div className="text-[10px] text-white/40 -mt-0.5">{roleDisplay}</div>
              </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="px-6 py-2 text-xs tracking-[0.15em] text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400 rounded transition"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </nav>

      {/* Sidebar - Pass collapse state */}
      <Sidebar 
        isOpen={showMobileSidebar} 
        onClose={() => setShowMobileSidebar(false)}
        isCollapsed={!isSidebarOpen}     // Desktop collapsed state
      />
    </>
  );
}