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
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-200 h-20 shadow-sm">
        <div className="flex items-center h-20">

          {/* Desktop: sidebar-aligned left section */}
          <div className={`hidden lg:flex items-center h-full border-r border-slate-200 px-4 flex-shrink-0 transition-all duration-300 ${isSidebarOpen ? 'w-64 gap-3' : 'w-20 justify-center'}`}>
            <button
              onClick={toggleSidebar}
              className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-xl hover:bg-slate-100 transition text-slate-500 flex-shrink-0"
            >
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            {isSidebarOpen && (
              <Link to="/dashboard" className="serif-font text-xl italic text-[#6366f1] tracking-tight font-bold truncate">
                Calyxia
              </Link>
            )}
          </div>

          {/* Mobile: hamburger + logo */}
          <div className="lg:hidden flex items-center gap-3 px-4">
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="flex flex-col gap-1.5 justify-center items-center w-9 h-9 rounded-xl hover:bg-slate-100 transition text-slate-500"
            >
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
              <div className="w-4 h-0.5 bg-current rounded-full" />
            </button>
            <Link to="/dashboard" className="serif-font text-xl italic text-[#6366f1] tracking-tight font-bold">
              Calyxia
            </Link>
          </div>

          {/* Right: User info + Sign out */}
          <div className="flex-1 flex items-center justify-end px-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#6366f1] flex items-center justify-center text-white text-sm font-bold shadow-md shadow-[#6366f1]/30">
                {userInitial}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-[#1e1b4b]">{username}</div>
                <div className="text-[10px] text-slate-400 capitalize -mt-0.5">{roleDisplay}</div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="px-5 py-2 text-xs font-semibold tracking-wide text-red-500 hover:text-white hover:bg-red-500 border border-red-200 hover:border-red-500 rounded-xl transition-all"
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
