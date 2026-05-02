import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';

export default function Sidebar() {
  const { user } = useAuth();
  const { hasRight, loading: rightsLoading } = useRights();
  const location = useLocation();

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdminOrSuper = userType === 'ADMIN' || userType === 'SUPERADMIN';

  if (rightsLoading) return <div className="w-64 border-r border-white/10 bg-black/50" />;

  return (
    <div className="w-64 border-r border-white/10 bg-black/50 h-full overflow-y-auto hidden lg:block">
      <div className="p-8">
        
        {/* ADMINISTRATION SECTION (ADMIN + SUPERADMIN only) */}
        {isAdminOrSuper && (
          <>
            <div className="text-xs tracking-[0.5em] text-white/50 mb-8 uppercase">Administration</div>
            
            <nav className="space-y-1">
              <Link to="/dashboard" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/dashboard' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>
                DASHBOARD
              </Link>

              <Link to="/admin" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>
                USER REGISTRY
              </Link>

              {/* ACCESS RULES - Only SUPERADMIN */}
              {userType === 'SUPERADMIN' && (
                <Link to="/admin/rights" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin/rights' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>
                  ACCESS RULES
                </Link>
              )}

              <Link to="/admin/products" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/admin/products' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>
                INVENTORY
              </Link>

              {/* DELETED ITEMS - Only ADMIN + SUPERADMIN (PRD_RESTORE) */}
              {hasRight('PRD_RESTORE') && (
                <Link to="/deleted-items" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/deleted-items' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>
                  DELETED ITEMS
                </Link>
              )}
            </nav>
          </>
        )}

        {/* REPORTS - Visible to all with REP_VIEW (including USER) */}
        {hasRight('REP_VIEW') && (
          <div className="mt-4">
            <Link to="/reports" className={`block px-4 py-3 text-sm tracking-widest transition ${location.pathname === '/reports' ? 'text-[#d4af37] border-l-2 border-[#d4af37]' : 'hover:text-white text-white/70'}`}>
              REPORTS
            </Link>
          </div>
        )}

        {/* PUBLIC LINKS */}
        <div className={`mt-12 pt-8 ${isAdminOrSuper ? 'border-t border-white/10' : ''}`}>
          <div className="text-xs text-white/40 uppercase tracking-widest">Navigation</div>
          <Link to="/products" className="block mt-4 text-xs text-white/50 hover:text-[#d4af37] transition uppercase tracking-widest">
            ← Back to Collection
          </Link>
        </div>
      </div>
    </div>
  );
}