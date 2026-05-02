import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';

export default function Sidebar() {
  const { user } = useAuth();
  const { hasRight } = useRights();
  const location = useLocation();

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdmin = userType === 'ADMIN' || userType === 'SUPERADMIN';

  if (!isAdmin) return null;

  return (
    <div className="w-64 border-r border-white/10 bg-black/50 h-full overflow-y-auto hidden lg:block">
      <div className="p-8">
        <div className="text-xs tracking-[0.5em] text-white/50 mb-8">ADMINISTRATION</div>
        
        <nav className="space-y-1">
          <Link to="/admin" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>USER REGISTRY</Link>
          <Link to="/admin/products" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin/products' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>INVENTORY</Link>
          {hasRight('PRD_DEL') && (
            <Link to="/deleted-items" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/deleted-items' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>DELETED ITEMS</Link>
          )}
        </nav>

        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="text-xs text-white/40">QUICK LINKS</div>
          <Link to="/products" className="block mt-4 text-xs text-white/50 hover:text-[#d4af37] transition">← Back to Collection</Link>
        </div>
      </div>
    </div>
  );
}