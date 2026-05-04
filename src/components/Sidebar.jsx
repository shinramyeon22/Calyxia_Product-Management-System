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

  // Helper function to handle active link styling to keep code clean
  const getLinkStyle = (path) => 
    `block px-4 py-3 text-sm tracking-widest transition ${
      location.pathname === path 
        ? 'text-[#d4af37] border-l-2 border-[#d4af37]' 
        : 'hover:text-white text-white/70'
    }`;

  return (
    <div className="w-64 border-r border-white/10 bg-black/50 h-full overflow-y-auto hidden lg:block">
      <div className="p-8">
        
        {/* ADMINISTRATION SECTION */}
        {isAdminOrSuper && (
          <>
            <div className="text-xs tracking-[0.5em] text-white/50 mb-8 uppercase">Administration</div>
            
            <nav className="space-y-1">
              <Link to="/dashboard" className={getLinkStyle('/dashboard')}>
                DASHBOARD
              </Link>

              {/* PR-01: Admin Module sidebar link gated by ADM_USER === 1 */}
              {hasRight('ADM_USER') && (
                <Link to="/admin" className={getLinkStyle('/admin')}>
                  USER REGISTRY
                </Link>
              )}

              {/* ACCESS RULES - Only SUPERADMIN */}
              {userType === 'SUPERADMIN' && (
                <Link to="/admin/rights" className={getLinkStyle('/admin/rights')}>
                  ACCESS RULES
                </Link>
              )}

              <Link to="/admin/products" className={getLinkStyle('/admin/products')}>
                INVENTORY
              </Link>

              {hasRight('PRD_RESTORE') && (
                <Link to="/deleted-items" className={getLinkStyle('/deleted-items')}>
                  DELETED ITEMS
                </Link>
              )}
            </nav>
          </>
        )}

        {/* REPORTS SECTION */}
        {/* Only show the section if the user has at least one report right */}
        {(hasRight('REP_001') || hasRight('REP_002')) && (
          <div className="mt-8">
            <div className="text-xs tracking-[0.5em] text-white/50 mb-4 uppercase">Reports</div>
            <nav className="space-y-1">
              
              {/* PR-01: REP_001 link gated */}
              {hasRight('REP_001') && (
                <Link to="/reports/sales" className={getLinkStyle('/reports/sales')}>
                  SALES REPORT
                </Link>
              )}

              {/* PR-01: REP_002 link gated */}
              {hasRight('REP_002') && (
                <Link to="/reports/inventory" className={getLinkStyle('/reports/inventory')}>
                  INVENTORY REPORT
                </Link>
              )}

            </nav>
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