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

  // 1. LOADING STATE: 
  // Prevents the "Empty Navbar" flicker while role is being verified
  if (loading) {
    return (
      <nav className="bg-[#0f0f12] border-b border-[#1f1f23] p-4 h-16">
        <div className="max-w-7xl mx-auto flex justify-between items-center opacity-20">
          <div className="h-6 w-24 bg-gray-700 rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  // 2. MAIN NAV STATE:
  return (
    <nav className="relative z-50 bg-[#0f0f12] border-b border-[#1f1f23] p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <Link to="/products" className="text-xl font-bold text-white hover:text-purple-400 transition">
            Calyxia
          </Link>
          
          <div className="flex gap-6">
            <Link to="/products" className="text-gray-400 hover:text-white transition cursor-pointer">
              Products
            </Link>

            {/* Admin Dashboard Link - Checks user type case-insensitively */}
            {user?.user_type?.toUpperCase() === 'ADMIN' ? (
              <Link 
                to="/admin" 
                className="text-purple-400 hover:text-purple-300 font-bold transition border-b border-purple-400/50"
              >
                Admin Dashboard
              </Link>
            ) : (
              /* Tiny debug helper to see role if it's not working */
              <span className="text-[10px] text-gray-700 self-center">
                Role: {user?.user_type || 'NONE'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-500">{user?.email}</span>
          <button 
            onClick={handleLogout} 
            className="text-gray-400 hover:text-red-400 text-sm transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}