import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const { hasRight } = useRights();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';
  const username = user?.email?.split('@')[0] || 'User';

  // Use hasRight as primary check + fallback to user_type
  const isAdmin = hasRight('admin') || 
                  hasRight('superadmin') || 
                  ['ADMIN', 'SUPERADMIN'].includes(
                    (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase()
                  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-black border-b border-white/10 z-[200]">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Link to="/dashboard" className="serif-font text-3xl italic text-[#d4af37] tracking-tighter">
            Calyxia
          </Link>
        </div>

        {/* Right: User + PRODUCTS + MENU + SIGN OUT */}
        <div className="flex items-center gap-4">
          {/* User Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-black text-sm font-medium">
              {userInitial}
            </div>
            <span className="text-sm text-white/80 hidden md:block">{username}</span>
          </div>

          {/* PRODUCTS Button */}
          <Link
            to="/products"
            className="px-6 py-2 text-xs tracking-[0.15em] text-white/70 hover:text-[#d4af37] transition border border-white/20 hover:border-[#d4af37] rounded"
          >
            PRODUCTS
          </Link>

          {/* MENU Button with Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded transition"
            >
              MENU
              <div className="space-y-1">
                <div className="w-4 h-[1px] bg-current"></div>
                <div className="w-4 h-[1px] bg-current"></div>
                <div className="w-4 h-[1px] bg-current"></div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[#0a0a0c] border border-white/10 rounded shadow-2xl py-2 z-[300]">
                <Link
                  to="/dashboard"
                  className="block px-6 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-[#d4af37] transition"
                  onClick={() => setShowMenu(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/products"
                  className="block px-6 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-[#d4af37] transition"
                  onClick={() => setShowMenu(false)}
                >
                  Browse Products
                </Link>
                <Link
                  to="/reports"
                  className="block px-6 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-[#d4af37] transition"
                  onClick={() => setShowMenu(false)}
                >
                  Reports
                </Link>

                {isAdmin && (
                  <>
                    <div className="border-t border-white/10 my-1"></div>
                    <Link
                      to="/admin"
                      className="block px-6 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-[#d4af37] transition"
                      onClick={() => setShowMenu(false)}
                    >
                      User Management
                    </Link>
                    <Link
                      to="/admin/products"
                      className="block px-6 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-[#d4af37] transition"
                      onClick={() => setShowMenu(false)}
                    >
                      Product Management
                    </Link>
                    <Link
                      to="/deleted-items"
                      className="block px-6 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-[#d4af37] transition"
                      onClick={() => setShowMenu(false)}
                    >
                      Deleted Items
                    </Link>
                  </>
                )}

                <div className="border-t border-white/10 my-1"></div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-6 py-3 text-sm text-red-400 hover:bg-red-950/50 transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}