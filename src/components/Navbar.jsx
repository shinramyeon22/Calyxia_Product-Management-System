import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-black/90 backdrop-blur-md border-b border-white/10" />;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-8 py-7 flex justify-between items-center">
        <Link to="/products" className="serif-font text-4xl italic tracking-tighter hover:text-[#d4af37] transition-colors">
          Calyxia
        </Link>

        <div className="flex items-center gap-10 text-sm tracking-[0.125em] uppercase">
          <Link to="/products" className="hover:text-[#d4af37] transition-colors">Collection</Link>

          {user?.user_type === 'ADMIN' && (
            <div className="flex items-center gap-8 border-l border-white/10 pl-8">
              <Link to="/admin" className="hover:text-[#d4af37] transition-colors">Users</Link>
              <Link to="/admin/products" className="text-[#d4af37] font-medium border-b border-[#d4af37] pb-0.5">Inventory</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {user && <span className="text-xs text-white/50 tracking-widest hidden md:block">{user.email}</span>}
          <button 
            onClick={handleLogout}
            className="px-6 py-3 text-xs tracking-widest border border-white/30 hover:border-[#d4af37] hover:text-[#d4af37] transition-all"
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </nav>
  );
}