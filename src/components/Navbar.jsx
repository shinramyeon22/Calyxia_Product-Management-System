import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const userInitial = user?.email?.[0]?.toUpperCase() || 'U';

  if (loading) {
    return <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-black/90 backdrop-blur-md border-b border-white/10" />;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-7 flex justify-between items-center">
        <Link to="/products" className="serif-font text-4xl italic tracking-tighter hover:text-[#d4af37] transition-colors">
          Calyxia
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10 text-sm tracking-[0.125em] uppercase">
          <Link to="/products" className="hover:text-[#d4af37] transition-colors">Collection</Link>

          {(user?.user_type === 'ADMIN' || user?.user_type === 'SUPERADMIN') && (
            <div className="flex items-center gap-8 border-l border-white/10 pl-8">
              <Link to="/admin" className="hover:text-[#d4af37] transition-colors">Users</Link>
              <Link to="/admin/products" className="text-[#d4af37] font-medium border-b border-[#d4af37] pb-0.5">Inventory</Link>
            </div>
          )}
        </div>

        {/* User + Actions */}
        <div className="flex items-center gap-4">
          {user && (
            <div className="hidden md:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#d4af37] text-black flex items-center justify-center text-sm font-medium">
                {userInitial}
              </div>
              <span className="text-xs text-white/50 tracking-widest">{user.email?.split('@')[0]}</span>
            </div>
          )}

          <button 
            onClick={handleLogout}
            className="px-6 py-3 text-xs tracking-widest border border-white/30 hover:border-[#d4af37] hover:text-[#d4af37] transition-all hidden md:block"
          >
            SIGN OUT
          </button>

          {/* Mobile Hamburger */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-[#d4af37] text-xl"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-8 py-8 text-sm tracking-widest">
          <div className="flex flex-col gap-6">
            <Link to="/products" className="hover:text-[#d4af37]" onClick={() => setMobileMenuOpen(false)}>Collection</Link>
            
            {(user?.user_type === 'ADMIN' || user?.user_type === 'SUPERADMIN') && (
              <>
                <Link to="/admin" className="hover:text-[#d4af37]" onClick={() => setMobileMenuOpen(false)}>User Registry</Link>
                <Link to="/admin/products" className="hover:text-[#d4af37]" onClick={() => setMobileMenuOpen(false)}>Inventory Vault</Link>
              </>
            )}
            
            <div className="pt-6 border-t border-white/10">
              <button 
                onClick={handleLogout}
                className="w-full py-4 border border-white/30 text-xs tracking-widest hover:border-[#d4af37] hover:text-[#d4af37] transition"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
