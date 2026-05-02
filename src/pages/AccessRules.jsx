import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

// RoleBadge defined OUTSIDE the component
const RoleBadge = ({ role, color }) => (
  <span className={`px-3 py-1 text-xs tracking-widest border ${color}`}>
    {role}
  </span>
);

const AccessRules = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userType = (user?.user_type || user?.raw_user_meta_data?.user_type || 'USER').toUpperCase();

  React.useEffect(() => {
    if (userType !== 'SUPERADMIN') {
      navigate('/admin', { replace: true });
    }
  }, [userType, navigate]);

  const matrix = [
    { page: 'Login/Register', user: true, admin: true, superadmin: true },
    { page: 'Dashboard', user: true, admin: true, superadmin: true },
    { page: 'Product List', user: true, admin: true, superadmin: true },
    { page: 'Add Product', user: true, admin: true, superadmin: true },
    { page: 'Edit Product', user: true, admin: true, superadmin: true },
    { page: 'Delete Product', user: false, admin: false, superadmin: true },
    { page: 'Deleted Items', user: false, admin: true, superadmin: true },
    { page: 'Restore Product', user: false, admin: true, superadmin: true },
    { page: 'User Management', user: false, admin: true, superadmin: true },
    { page: 'Rights Management', user: false, admin: false, superadmin: true },
    { page: 'Product Reports', user: true, admin: true, superadmin: true },
    { page: 'Top Selling Report', user: false, admin: false, superadmin: true },
    { page: 'View Stamp/Audit', user: false, admin: true, superadmin: true },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-20">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-8 py-16">
          <div className="mb-12">
            <div className="flex items-center gap-4">
              <span className="text-[#d4af37] text-xs tracking-[0.5em]">SYSTEM CONTROL</span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>
            <h1 className="serif-font text-6xl italic tracking-tighter mt-2">Access Rules Matrix</h1>
            <p className="text-white/50 mt-3 max-w-md">
              This matrix defines exactly what each role can and cannot do across the entire system.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 mb-10">
            <RoleBadge role="USER" color="border-white/30 text-white/70" />
            <RoleBadge role="ADMIN" color="border-[#d4af37] text-[#d4af37]" />
            <RoleBadge role="SUPERADMIN" color="border-emerald-500 text-emerald-400" />
          </div>

          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-black/60">
                <tr className="text-xs tracking-widest text-white/60">
                  <th className="px-8 py-5 text-left">INTERFACE / PAGE</th>
                  <th className="px-8 py-5 text-center">USER</th>
                  <th className="px-8 py-5 text-center">ADMIN</th>
                  <th className="px-8 py-5 text-center">SUPERADMIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {matrix.map((row, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-8 py-6 font-medium">{row.page}</td>
                    <td className="px-8 py-6 text-center">{row.user ? <span className="text-emerald-400 text-xl">✓</span> : <span className="text-red-400 text-xl">✗</span>}</td>
                    <td className="px-8 py-6 text-center">{row.admin ? <span className="text-emerald-400 text-xl">✓</span> : <span className="text-red-400 text-xl">✗</span>}</td>
                    <td className="px-8 py-6 text-center">{row.superadmin ? <span className="text-emerald-400 text-xl">✓</span> : <span className="text-red-400 text-xl">✗</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="border border-white/10 p-8">
              <div className="text-[#d4af37] text-xs tracking-[0.5em] mb-3">USER</div>
              <div className="text-sm text-white/70 leading-relaxed">Most limited role. Can view and manage basic products and reports, but cannot delete, restore, or access any administrative functions.</div>
            </div>
            <div className="border border-white/10 p-8">
              <div className="text-[#d4af37] text-xs tracking-[0.5em] mb-3">ADMIN</div>
              <div className="text-sm text-white/70 leading-relaxed">Management access with restrictions. Can manage users (except SUPERADMIN), view deleted items, restore products, and see audit data — but cannot permanently delete records or access top-level reports.</div>
            </div>
            <div className="border border-white/10 p-8">
              <div className="text-emerald-400 text-xs tracking-[0.5em] mb-3">SUPERADMIN</div>
              <div className="text-sm text-white/70 leading-relaxed">Full system control. Has unrestricted access to every feature, including rights management, top selling reports, full audit trails, and the ability to modify or delete any record.</div>
            </div>
          </div>

          <div className="mt-12 text-xs text-white/40 tracking-widest">
            This matrix is enforced in real-time by the application. Changes to user roles or rights will immediately affect what they can see and do.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessRules;