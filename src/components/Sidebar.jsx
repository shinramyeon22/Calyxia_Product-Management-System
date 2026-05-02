import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';

export default function Sidebar() {
  const { user } = useAuth();
  const { hasRight, loading: rightsLoading } = useRights();
  const location = useLocation();

  // PR-03: Determine role for Admin-only sections
  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdminOrSuper = userType === 'ADMIN' || userType === 'SUPERADMIN';

  // PR-03: Return a loading state if rights are still being fetched to prevent "Layout Shift"
  if (rightsLoading) return <div className="w-64 border-r border-white/10 bg-black/50" />;

  return (
    <div className="w-64 border-r border-white/10 bg-black/50 h-full overflow-y-auto hidden lg:block">
      <div className="p-8">
        
        {/* SECTION: ADMINISTRATION (Only visible to Admin/SuperAdmin) */}
        {isAdminOrSuper && (
          <>
            <div className="text-xs tracking-[0.5em] text-white/50 mb-8 uppercase">Administration</div>
            
            <nav className="space-y-1">
              <Link 
                to="/admin" 
                className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}
              >
                USER REGISTRY
              </Link>

              <Link 
                to="/admin/products" 
                className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin/products' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}
              >
                INVENTORY
              </Link>

              {/* PR-03: Specific Gating for Deleted Items based on PRD_DEL right */}
              {hasRight('PRD_DEL') && (
                <Link 
                  to="/deleted-items" 
                  className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/deleted-items' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}
                >
                  DELETED ITEMS
                </Link>
              )}
            </nav>
          </>
        )}

        {/* SECTION: PUBLIC QUICK LINKS (Visible to everyone) */}
        <div className={`mt-12 pt-8 ${isAdminOrSuper ? 'border-t border-white/10' : ''}`}>
          <div className="text-xs text-white/40 uppercase tracking-widest">Navigation</div>
          <Link 
            to="/products" 
            className="block mt-4 text-xs text-white/50 hover:text-[#d4af37] transition uppercase tracking-widest"
          >
            ← Back to Collection
          </Link>
        </div>
      </div>
    </div>
  );
}