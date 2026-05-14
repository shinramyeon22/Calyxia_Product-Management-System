import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRights } from '../context/UserRightsContext';
import { useState } from 'react';
import { useSidebar } from '../context/SidebarContext';

export default function Sidebar({ isOpen = false, onClose = () => {}, isCollapsed = false }) {
  const { user } = useAuth();
  const { hasRight, loading: rightsLoading } = useRights();
  const { isSidebarOpen, toggleSidebar } = useSidebar(); 
  const location = useLocation();

  const [openSections, setOpenSections] = useState({
    administration: true,
    inventory: true,
    reports: true,
  });

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();
  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(userType);

  if (rightsLoading) return null;

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
      <div className={`fixed top-0 left-0 border-r border-white/10 bg-black h-screen overflow-y-auto hidden lg:block z-[100] transition-all duration-300 ${
        !isSidebarOpen ? 'w-20' : 'w-64'
      }`}>
        
        {/* SIDEBAR HEADER: Burger + Brand */}
        <div className={`flex items-center h-24 border-b border-white/5 mb-6 px-6 ${!isSidebarOpen ? 'justify-center' : 'gap-4'}`}>
          <button 
            onClick={toggleSidebar} 
            className="text-white hover:text-[#d4af37] transition-colors p-2"
          >
            {/* Minimal Burger Icon */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          
          {isSidebarOpen && (
            <div className="serif-font text-2xl italic text-[#d4af37] animate-in fade-in duration-500">
              Calyxia
            </div>
          )}
        </div>

        {/* NAVIGATION LINKS */}
        <div className={`transition-all duration-300 ${!isSidebarOpen ? 'px-3' : 'p-8'} space-y-10`}>
          {isSidebarOpen ? (
            <>
              {/* ADMINISTRATION SECTION */}
              {isAdmin && (
                <div>
                  <div onClick={() => toggleSection('administration')} className="flex justify-between text-[10px] tracking-[0.5em] text-white/40 mb-4 uppercase cursor-pointer hover:text-white transition-colors">
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

              {/* INVENTORY SECTION */}
<div className="space-y-2">
  <p className="text-white/30 text-[10px] tracking-[0.2em] uppercase px-4 mb-4">Inventory</p>
  
  {/* PRODUCT PAGE - Now visible to everyone */}
  {/* Visible to everyone */}
<Link 
  to="/products" 
  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
>
  <span className="text-sm tracking-widest uppercase">Product</span>
</Link>

  {/* PRODUCT LISTING - Also accessible to users now */}
<Link 
  to="/products?tab=listing" 
  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
>
  <span className="text-sm tracking-widest uppercase">Product Listing</span>
</Link>
</div>

              {/* REPORTS SECTION */}
              {userType === 'SUPERADMIN' && (hasRight('REP_001') || hasRight('REP_002')) && (
                <div>
                  <div 
                    onClick={() => toggleSection('reports')} 
                    className="flex justify-between text-[10px] tracking-[0.5em] text-white/40 mb-4 uppercase cursor-pointer hover:text-white transition-colors"
                  >
                    <span>REPORTS</span>
                    <span>{openSections.reports ? '−' : '+'}</span>
                  </div>
                  
                  {openSections.reports && (
                    <nav className="space-y-1">
                      {hasRight('REP_001') && (
                        <Link to="/reports" className={getLinkStyle('/reports')} onClick={handleLinkClick}>Top Selling Report</Link>
                      )}
                    </nav>
                  )}
                </div>
              )}
            </>
          ) : (
            /* COLLAPSED STATE ICONS (Optional) */
            <div className="flex flex-col items-center gap-8 pt-4 text-white/40">
                <Link to="/dashboard" title="Dashboard">🏠</Link>
                <Link to="/products" title="Inventory">📦</Link>
                {userType === 'SUPERADMIN' && <Link to="/reports" title="Reports">📊</Link>}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 w-72 bg-black border-r border-white/10 z-[200] lg:hidden p-8 overflow-y-auto">
          <div className="flex justify-between items-center mb-10">
            <div className="serif-font text-3xl italic text-[#d4af37]">Calyxia</div>
            <button onClick={onClose} className="text-3xl text-white/70">×</button>
          </div>
        </div>
      )}
    </>
  );
}