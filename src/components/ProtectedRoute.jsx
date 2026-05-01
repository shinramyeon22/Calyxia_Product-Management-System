import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-[1px] bg-[#d4af37] mx-auto mb-6 animate-pulse"></div>
          <p className="text-[#d4af37] text-xs tracking-[0.5em] uppercase">VERIFYING PERMISSIONS</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.user_type?.toUpperCase() !== 'ADMIN') return <Navigate to="/products" replace />;

  return children;
}