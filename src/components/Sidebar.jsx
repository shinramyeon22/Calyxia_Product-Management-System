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

  const normalizeUserType = (type) => String(type || 'USER').trim().replace(/[\s_-]+/g, '').toUpperCase();
  const userType = normalizeUserType(
    user?.user_type ||
    user?.raw_user_meta_data?.user_type ||
    user?.raw_user_meta_data?.role ||
    user?.user_metadata?.user_type ||
    user?.user_metadata?.role ||
    user?.app_metadata?.user_type ||
    user?.app_metadata?.role
  );
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

    return `flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
      isActive
        ? 'bg-[#eef2ff] text-[#6366f1] border-l-2 border-[#6366f1]'
        : 'text-slate-600 hover:text-[#1e1b4b] hover:bg-slate-50'
    }`;
  };

  const handleLinkClick = () => onClose && onClose();

  const SectionHeader = ({ label, section }) => (
    <div
      onClick={() => toggleSection(section)}
      className="flex justify-between items-center text-[10px] tracking-[0.4em] text-slate-400 mb-3 uppercase cursor-pointer hover:text-slate-600 transition-colors select-none"
    >
      <span>{label}</span>
      <span className="text-slate-300">{openSections[section] ? '−' : '+'}</span>
    </div>
  );

  return (
    <>
      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <div className={`fixed top-0 left-0 border-r border-slate-200 bg-white h-screen overflow-y-auto hidden lg:block z-[100] transition-all duration-300 shadow-sm ${
        !isSidebarOpen ? 'w-20' : 'w-64'
      }`}>

        {/* NAVIGATION LINKS */}
        <div className={`pt-24 pb-6 transition-all duration-300 ${!isSidebarOpen ? 'px-3' : 'px-4'} space-y-6`}>
          {isSidebarOpen ? (
            <>
              {/* ADMINISTRATION SECTION */}
              {isAdmin && (
                <div>
                  <SectionHeader label="Administration" section="administration" />
                  {openSections.administration && (
                    <nav className="space-y-1">
                      <Link to="/dashboard" className={getLinkStyle('/dashboard')} onClick={handleLinkClick}>
                        Dashboard
                      </Link>
                      {userType === 'SUPERADMIN' && (
                        <Link to="/admin" className={getLinkStyle('/admin')} onClick={handleLinkClick}>
                          User Registry
                        </Link>
                      )}
                      <Link to="/deleted-items" className={getLinkStyle('/deleted-items')} onClick={handleLinkClick}>
                        Deleted Items
                      </Link>
                    </nav>
                  )}
                </div>
              )}

              {/* INVENTORY SECTION */}
              <div>
                <div className="text-[10px] tracking-[0.4em] text-slate-400 mb-3 uppercase">Inventory</div>
                <nav className="space-y-1">
                  <Link to="/admin/products" className={getLinkStyle('/admin/products')} onClick={handleLinkClick}>
                    Product
                  </Link>
                  <Link to="/products?tab=listing" className={getLinkStyle('/products', 'listing')} onClick={handleLinkClick}>
                    Product Listing
                  </Link>
                </nav>
              </div>

              {/* REPORTS SECTION */}
              {userType === 'SUPERADMIN' && (hasRight('REP_001') || hasRight('REP_002')) && (
                <div>
                  <SectionHeader label="Reports" section="reports" />
                  {openSections.reports && (
                    <nav className="space-y-1">
                      {hasRight('REP_001') && (
                        <Link to="/reports" className={getLinkStyle('/reports')} onClick={handleLinkClick}>
                          Top Selling Report
                        </Link>
                      )}
                    </nav>
                  )}
                </div>
              )}
            </>
          ) : (
            /* COLLAPSED STATE ICONS */
            <div className="flex flex-col items-center gap-5 pt-2">
              <Link to="/dashboard" title="Dashboard" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#6366f1] hover:bg-[#eef2ff] transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <Link to="/admin/products" title="Product" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#6366f1] hover:bg-[#eef2ff] transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </Link>
              <Link to="/products" title="Product Listing" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#6366f1] hover:bg-[#eef2ff] transition-all">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </Link>
              {userType === 'SUPERADMIN' && (
                <Link to="/reports" title="Reports" className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#6366f1] hover:bg-[#eef2ff] transition-all">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-[#1e1b4b]/30 backdrop-blur-sm z-[199] lg:hidden" onClick={onClose} />
          <div className="fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-[200] lg:hidden overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center h-20 px-6 border-b border-slate-100">
              <Link to="/dashboard" className="serif-font text-2xl italic text-[#6366f1] font-bold">Calyxia</Link>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition text-xl">×</button>
            </div>

            <div className="px-4 py-6 space-y-6">
              {isAdmin && (
                <div>
                  <SectionHeader label="Administration" section="administration" />
                  {openSections.administration && (
                    <nav className="space-y-1">
                      <Link to="/dashboard" className={getLinkStyle('/dashboard')} onClick={handleLinkClick}>Dashboard</Link>
                      {userType === 'SUPERADMIN' && (
                        <Link to="/admin" className={getLinkStyle('/admin')} onClick={handleLinkClick}>User Registry</Link>
                      )}
                      <Link to="/deleted-items" className={getLinkStyle('/deleted-items')} onClick={handleLinkClick}>Deleted Items</Link>
                    </nav>
                  )}
                </div>
              )}

              <div>
                <div className="text-[10px] tracking-[0.4em] text-slate-400 mb-3 uppercase">Inventory</div>
                <nav className="space-y-1">
                  <Link to="/admin/products" className={getLinkStyle('/admin/products')} onClick={handleLinkClick}>Product</Link>
                  <Link to="/products?tab=listing" className={getLinkStyle('/products', 'listing')} onClick={handleLinkClick}>Product Listing</Link>
                </nav>
              </div>

              {userType === 'SUPERADMIN' && (hasRight('REP_001') || hasRight('REP_002')) && (
                <div>
                  <SectionHeader label="Reports" section="reports" />
                  {openSections.reports && (
                    <nav className="space-y-1">
                      {hasRight('REP_001') && (
                        <Link to="/reports" className={getLinkStyle('/reports')} onClick={handleLinkClick}>Top Selling Report</Link>
                      )}
                    </nav>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
