import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import { useState } from 'react';
import { useSidebar } from '../context/SidebarContext';   // ← Make sure this is imported

export default function Sidebar({ isOpen = false, onClose = () => {}, isCollapsed = false }) {
  const { user } = useAuth();
  const { hasRight, loading: rightsLoading } = useRights();   // Keep hasRight for Reports
  const { isSidebarOpen } = useSidebar();                     // For collapse state
  const location = useLocation();

  const [openSections, setOpenSections] = useState({
    administration: true,
    inventory: true,
    reports: true,
  });

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userType);

  if (rightsLoading) return <div className="w-64 hidden lg:block" />;

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

const getLinkStyle = (path, queryTab = null) => {
  const currentPath = location.pathname;
  const currentTab = new URLSearchParams(location.search).get('tab');
  
  const isActive = currentPath === path && 
    (queryTab === null ? !currentTab : currentTab === queryTab);
  
  return `flex items-center gap-3 px-4 py-3 text-sm tracking-widest transition rounded-lg ${
    isActive 
      ? 'bg-[#d4af37]/10 text-[#d4af37] border-l-2 border-[#d4af37]' 
      : 'hover:bg-white/5 text-white/70 hover:text-white'
  }`;
};

  const handleLinkClick = () => onClose && onClose();

  return (
    <>
      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <div className={`fixed top-20 left-0 border-r border-white/10 bg-black/95 h-[calc(100vh-5rem)] overflow-y-auto hidden lg:block z-50 transition-all duration-300 ${
        isCollapsed || !isSidebarOpen ? 'w-16' : 'w-64'
      }`}>
        <div className={`p-6 ${isCollapsed || !isSidebarOpen ? 'px-3' : 'p-8'} space-y-10`}>
          {!(isCollapsed || !isSidebarOpen) && (
            <>
              {/* ADMINISTRATION */}
              {isAdmin && (
                <div>
                  <div onClick={() => toggleSection('administration')} className="flex justify-between text-xs tracking-[0.5em] text-white/50 mb-4 uppercase cursor-pointer hover:text-white">
                    <span>ADMINISTRATION</span>
                    <span>{openSections.administration ? '−' : '+'}</span>
                  </div>
                  {openSections.administration && (
                    <nav className="space-y-1">
                      <Link to="/dashboard" className={getLinkStyle('/dashboard')} onClick={handleLinkClick}>Dashboard</Link>
                      {userType === 'SUPERADMIN' && <Link to="/admin" className={getLinkStyle('/admin')} onClick={handleLinkClick}>User Registry</Link>}
                      <Link to="/deleted-items" className={getLinkStyle('/deleted-items')} onClick={handleLinkClick}>Deleted Items</Link>
                    </nav>
                  )}
                </div>
              )}

              {/* INVENTORY */}
              <div>
                <div onClick={() => toggleSection('inventory')} className="flex justify-between text-xs tracking-[0.5em] text-white/50 mb-4 uppercase cursor-pointer hover:text-white">
                  <span>INVENTORY</span>
                  <span>{openSections.inventory ? '−' : '+'}</span>
                </div>
                {openSections.inventory && (
                  <nav className="space-y-1">
                    
                {isAdmin && (
                  
<Link 
        to="/admin/products"
        className={getLinkStyle('/admin/products')}
        onClick={handleLinkClick}
      >
        Product
      </Link>
                )}
                
        <Link 
        to="/products?tab=listing"
        className={getLinkStyle('/products','listing')}
        onClick={handleLinkClick}
        >
          Product Listing
        </Link>
                  </nav>
                )}
              </div>

{/* REPORTS - Completely hidden unless user is SUPERADMIN */}
{userType === 'SUPERADMIN' && (hasRight('REP_001') || hasRight('REP_002')) && (
  <div>
    <div 
      onClick={() => toggleSection('reports')} 
      className="flex justify-between text-xs tracking-[0.5em] text-white/50 mb-4 uppercase cursor-pointer hover:text-white"
    >
      <span>REPORTS</span>
      <span>{openSections.reports ? '−' : '+'}</span>
    </div>
    
    {openSections.reports && (
      <nav className="space-y-1">
        {hasRight('REP_001') && (
          <Link 
            to="/reports" 
            className={getLinkStyle('/reports')} 
            onClick={handleLinkClick}
          >
            Top Selling Report
          </Link>
        )}
      </nav>
    )}
  </div>
)}
            </>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 w-72 bg-black border-r border-white/10 z-[200] lg:hidden p-8 overflow-y-auto">
          {/* Mobile menu content - you can expand this similarly */}
          <div className="flex justify-between items-center mb-10">
            <div className="serif-font text-3xl italic text-[#d4af37]">Calyxia</div>
            <button onClick={onClose} className="text-3xl text-white/70">×</button>
          </div>
          {/* Add mobile menu items here similar to desktop if needed */}
        </div>
      )}
    </>
  );
}